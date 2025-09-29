// api/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { admin, db } from "./firebaseAdmin.js";
import { DateTime, Interval } from "luxon";
import { verifyToken, requireAdmin } from "./middleware/auth.js";

dotenv.config();

const app = express();
app.use(express.json());

// ================= CORS =================
const allowedOrigins = [
  "http://localhost:3000", // local dev
  "https://mini-hcm.vercel.app", // frontend production
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server or curl requests with no origin
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// explicitly handle OPTIONS
app.options("*", cors());

// ================= Helpers =================
async function getUserDoc(uid) {
  try {
    const snap = await db.collection("users").doc(uid).get();
    return snap.exists ? snap.data() : null;
  } catch (err) {
    console.error("getUserDoc error:", err);
    return null;
  }
}

function overlapHours(intervalA, intervalB) {
  const inter = intervalA.intersection(intervalB);
  if (!inter) return 0;
  return inter.toDuration(["hours"]).hours;
}

function toFirestoreTimestampFromAny(ts) {
  // Accepts admin.Timestamp, JS Date, ISO string, or object with _seconds
  if (!ts) return null;
  if (ts.toDate && typeof ts.toDate === "function") return ts; // already admin.Timestamp
  if (typeof ts === "string" || ts instanceof String) {
    const d = new Date(ts);
    if (!isNaN(d)) return admin.firestore.Timestamp.fromDate(d);
  }
  if (ts instanceof Date) return admin.firestore.Timestamp.fromDate(ts);
  if (ts._seconds) return admin.firestore.Timestamp.fromMillis(ts._seconds * 1000 + (ts._nanoseconds || 0) / 1e6);
  return null;
}

// ================= Attendance =================
app.post("/api/punch", verifyToken, async (req, res) => {
  try {
    const { type } = req.body;
    if (!["in", "out"].includes(type)) {
      return res.status(400).json({ error: "type must be 'in' or 'out'" });
    }

    const userDoc =
      (await getUserDoc(req.user.uid)) || {
        timezone: "UTC",
        schedule: { start: "09:00", end: "18:00" },
        role: "employee",
        name: req.user.email,
      };

    const tz = userDoc.timezone || "UTC";
    const nowLocal = DateTime.now().setZone(tz);
    const dateStr = nowLocal.toISODate();

    const ref = db.collection("attendance").doc(`${req.user.uid}_${dateStr}`);
    const docSnap = await ref.get();
    const data = docSnap.exists ? docSnap.data() : null;

    // Prevent double punching
    const punchesArr = data?.punches || [];
    if (punchesArr.length > 0) {
      const last = punchesArr[punchesArr.length - 1];
      if (last.type === type) {
        return res.status(400).json({
          error: `Already punched ${type}, must punch ${type === "in" ? "out" : "in"} next.`,
        });
      }
    } else if (type === "out") {
      return res.status(400).json({ error: "Cannot punch out before punching in." });
    }

    const userName = userDoc.name || userDoc.fullName || req.user.email;

    const punch = {
      type,
      timestamp: admin.firestore.Timestamp.fromDate(nowLocal.toUTC().toJSDate()),
      source: "web",
      userId: req.user.uid,
      userName,
    };

    await ref.set(
      {
        userId: req.user.uid,
        userName,
        date: dateStr,
        lastTimestamp: punch.timestamp,
        punches: admin.firestore.FieldValue.arrayUnion(punch),
      },
      { merge: true }
    );

    return res.json({ success: true, punch });
  } catch (err) {
    console.error("🔥 Punch error:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ================= Admin Routes =================
// ================== GET Punches ==================
app.get("/api/admin/punches", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userName } = req.query;
    let q = db.collection("attendance");

    if (userName) {
      q = q.where("userName", "==", userName);
    } else {
      q = q.orderBy("lastTimestamp", "asc");
    }

    const snap = await q.get();
    const punches = [];

    snap.forEach((doc) => {
      const data = doc.data() || {};
      const name = data.userName || data.userId || "Unknown";

      (data.punches || []).forEach((p, idx) => {
        punches.push({
          id: `${doc.id}_${idx}`,   // combined id for convenience
          docId: doc.id,            // explicit docId
          index: idx,               // explicit punch index
          userId: data.userId,
          userName: name,
          type: p.type,
          timestamp: p.timestamp,
          source: p.source || "unknown",
        });
      });
    });

    // Sort manually if filtering by userName
    if (userName) {
      punches.sort((a, b) => {
        const aTime = a.timestamp?._seconds || a.timestamp?.seconds || 0;
        const bTime = b.timestamp?._seconds || b.timestamp?.seconds || 0;
        return aTime - bTime;
      });
    }

    return res.json({ punches });
  } catch (err) {
    console.error("🔥 admin/punches failed:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ================== EDIT Punch ==================
app.post("/api/admin/editPunch", verifyToken, requireAdmin, async (req, res) => {
  try {
    let { id, docId, index, type, timestampISO } = req.body;

    // Support both formats: "docId_index" OR explicit docId + index
    if (id && !docId && (index === undefined || index === null)) {
      const parts = id.split("_");
      index = parseInt(parts.pop(), 10);
      docId = parts.join("_");
    }

    if (!docId) return res.status(400).json({ error: "docId required" });
    if (index === undefined || index === null) return res.status(400).json({ error: "index required" });

    const punchIndex = parseInt(index, 10);
    if (isNaN(punchIndex)) {
      return res.status(400).json({ error: "Invalid index format" });
    }

    const ref = db.collection("attendance").doc(docId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Punch record not found" });

    const data = snap.data() || {};
    const punches = Array.isArray(data.punches) ? [...data.punches] : [];

    if (!punches[punchIndex]) {
      return res.status(404).json({ error: "Punch index not found" });
    }

    // Update only provided fields
    const updatedPunch = {
      ...punches[punchIndex],
      type: type || punches[punchIndex].type,
      editedBy: req.user.uid,
      editedAt: admin.firestore.Timestamp.now(),
    };

    if (timestampISO) {
      const ts = toFirestoreTimestampFromAny(timestampISO);
      if (!ts) return res.status(400).json({ error: "Invalid timestampISO" });
      updatedPunch.timestamp = ts;
    }

    punches[punchIndex] = updatedPunch;

    await ref.update({ punches });

    return res.json({
      success: true,
      message: "Punch updated successfully",
      docId,
      index: punchIndex,
      punch: updatedPunch,
    });
  } catch (err) {
    console.error("🔥 editPunch failed:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});


// ================= Summary =================
app.post("/api/computeSummary", verifyToken, async (req, res) => {
  try {
    const targetUserId = req.body.userId || req.user.uid;
    const dateStr = req.body.date;
    if (!dateStr) return res.status(400).json({ error: "date required" });

    const userDoc =
      (await getUserDoc(targetUserId)) || {
        timezone: "UTC",
        schedule: { start: "09:00", end: "18:00" },
        role: "employee",
      };

    const tz = userDoc.timezone || "UTC";
    const startOfDay = DateTime.fromISO(dateStr, { zone: tz }).startOf("day");
    const endOfDay = startOfDay.endOf("day");

    const snap = await db
      .collection("attendance")
      .where("userId", "==", targetUserId)
      .where("date", "==", dateStr)
      .get();

    const punches = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (Array.isArray(data.punches)) {
        data.punches.forEach((p) => {
          if (!p.timestamp) return;
          let dt = null;
          // handle admin.Timestamp, string, object with _seconds, or ISO
          if (p.timestamp.toDate && typeof p.timestamp.toDate === "function") dt = p.timestamp.toDate();
          else if (typeof p.timestamp === "string") dt = new Date(p.timestamp);
          else if (p.timestamp._seconds) dt = new Date(p.timestamp._seconds * 1000);
          else if (p.timestamp instanceof Date) dt = p.timestamp;

          if (dt && !isNaN(dt.getTime())) {
            punches.push({
              type: p.type,
              localDateTime: DateTime.fromJSDate(dt, { zone: tz }),
            });
          }
        });
      }
    });

    // sort by millis
    punches.sort((a, b) => a.localDateTime.toMillis() - b.localDateTime.toMillis());

    const pairs = [];
    let currentIn = null;

    for (const p of punches) {
      if (p.type === "in") {
        currentIn = p;
      } else if (p.type === "out" && currentIn) {
        pairs.push({ in: currentIn.localDateTime, out: p.localDateTime });
        currentIn = null;
      }
    }
    if (currentIn) {
      pairs.push({ in: currentIn.localDateTime, out: endOfDay });
    }

    const sched = userDoc.schedule || { start: "09:00", end: "18:00" };
    const schedStart = DateTime.fromISO(`${dateStr}T${sched.start}`, { zone: tz });
    let schedEnd = DateTime.fromISO(`${dateStr}T${sched.end}`, { zone: tz });
    if (schedEnd <= schedStart) schedEnd = schedEnd.plus({ days: 1 });
    const schedInterval = Interval.fromDateTimes(schedStart, schedEnd);

    // Night Differential: 22:00 - 06:00 (spans midnight)
    const ndStart = DateTime.fromISO(`${dateStr}T22:00:00`, { zone: tz });
    const ndEnd = DateTime.fromISO(`${dateStr}T06:00:00`, { zone: tz }).plus({ days: 1 });
    const ndInterval = Interval.fromDateTimes(ndStart, ndEnd);

    let total = 0;
    let regular = 0;
    let overtime = 0;
    let nd = 0;
    let late = 0;
    let undertime = 0;

    for (const { in: inDt, out: outDt } of pairs) {
      const workInt = Interval.fromDateTimes(inDt, outDt);
      const hours = workInt.toDuration(["hours"]).hours;
      total += hours;
      const regularHrs = overlapHours(workInt, schedInterval);
      regular += regularHrs;
      overtime += Math.max(0, hours - regularHrs);
      nd += overlapHours(workInt, ndInterval);
    }

    if (pairs.length > 0) {
      if (pairs[0].in > schedStart) {
        late = pairs[0].in.diff(schedStart, "minutes").minutes;
      }
      if (pairs[pairs.length - 1].out < schedEnd) {
        undertime = schedEnd.diff(pairs[pairs.length - 1].out, "minutes").minutes;
      }
    }

    const summary = {
      userId: targetUserId,
      userName: userDoc.name || userDoc.fullName || req.user.email,
      date: dateStr,
      timezone: tz,
      totalWorkedHours: +total.toFixed(2),
      regularHours: +regular.toFixed(2),
      overtimeHours: +overtime.toFixed(2),
      nightDiffHours: +nd.toFixed(2),
      lateMinutes: Math.round(late),
      undertimeMinutes: Math.round(undertime),
      generatedAt: admin.firestore.Timestamp.now(),
    };

    await db.collection("dailySummary").doc(`${targetUserId}_${dateStr}`).set(summary);

    return res.json(summary);
  } catch (err) {
    console.error("🔥 computeSummary failed:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ================= Reports =================
app.post("/api/admin/weeklyReport", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, weekStart } = req.body;
    if (!weekStart) return res.status(400).json({ error: "weekStart required" });

    const start = DateTime.fromISO(weekStart);
    const end = start.plus({ days: 6 }).toISODate();

    let q = db
      .collection("dailySummary")
      .where("date", ">=", weekStart)
      .where("date", "<=", end);
    if (userId) q = q.where("userId", "==", userId);

    const snap = await q.get();
    const days = snap.docs.map((d) => d.data());

    const totals = {
      regularHours: 0,
      overtimeHours: 0,
      nightDiffHours: 0,
      lateMinutes: 0,
      undertimeMinutes: 0,
    };
    for (const d of days) {
      totals.regularHours += d.regularHours || 0;
      totals.overtimeHours += d.overtimeHours || 0;
      totals.nightDiffHours += d.nightDiffHours || 0;
      totals.lateMinutes += d.lateMinutes || 0;
      totals.undertimeMinutes += d.undertimeMinutes || 0;
    }

    const report = { userId: userId || "all", weekStart, totals, days };
    await db.collection("weeklyReports").doc(`${userId || "all"}_${weekStart}`).set(report);

    return res.json(report);
  } catch (err) {
    console.error("🔥 weeklyReport failed:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.post("/api/admin/dailyReport", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "date required" });

    const snap = await db.collection("dailySummary").where("date", "==", date).get();
    return res.json({ date, report: snap.docs.map((d) => d.data()) });
  } catch (err) {
    console.error("🔥 dailyReport failed:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ================= Local run =================
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
}

// ================= Export for Vercel =================
export default (req, res) => {
  app(req, res);
};
