// backend/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { admin, db } from "./firebaseAdmin.js";
import { DateTime, Interval } from "luxon";

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Log all requests
app.all("*", (req, res, next) => {
  console.log("REQ:", req.method, req.url, "BODY:", req.body);
  next();
});

/* ================= Middleware ================= */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: "Missing Authorization header" });

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token", details: err.message });
  }
}

async function getUserDoc(uid) {
  const doc = await db.collection("users").doc(uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function requireAdmin(req, res, next) {
  const userDoc = await getUserDoc(req.user.uid);
  if (!userDoc || userDoc.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  req.userDoc = userDoc;
  next();
}

/* ================= Attendance ================= */
/* ================= Attendance ================= */
app.post("/punch", verifyToken, async (req, res) => {
  try {
    const { type } = req.body;
    if (!["in", "out"].includes(type)) {
      return res.status(400).json({ error: "type must be 'in' or 'out'" });
    }

    const userDoc = (await getUserDoc(req.user.uid)) || {
      timezone: "UTC",
      schedule: { start: "09:00", end: "18:00" },
      role: "employee",
      name: req.user.email,
    };

    const tz = userDoc.timezone || "UTC";
    const now = DateTime.now().setZone(tz);
    const dateStr = now.toISODate();

    const ref = db.collection("attendance").doc(`${req.user.uid}_${dateStr}`);
    const docSnap = await ref.get();
    const data = docSnap.data();

    // 🚦 Prevent double punching
    if (data?.punches?.length) {
      const last = data.punches[data.punches.length - 1];
      if (last.type === type) {
        return res.status(400).json({
          error: `Already punched ${type}, must punch ${
            type === "in" ? "out" : "in"
          } next.`,
        });
      }
    } else if (type === "out") {
      return res
        .status(400)
        .json({ error: "Cannot punch out before punching in." });
    }

    const userName = userDoc.name || userDoc.fullName || req.user.email;

    const punch = {
      type,
      timestamp: admin.firestore.Timestamp.fromDate(now.toUTC().toJSDate()),
      source: "web",
      userId: req.user.uid,   // 👈 optional but consistent
      userName: userName,     // 👈 NEW: embed name inside punches array
    };

    await ref.set(
      {
        userId: req.user.uid,
        userName, // 👈 still keep at root for queries
        date: dateStr,
        lastTimestamp: punch.timestamp,
        punches: admin.firestore.FieldValue.arrayUnion(punch),
      },
      { merge: true }
    );

    return res.json({ success: true, punch });
  } catch (err) {
    console.error("Punch error:", err);
    return res.status(500).json({ error: err.message });
  }
});


/* ================= Admin Routes ================= */
app.get("/admin/punches", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userName } = req.query;
    let q = db.collection("attendance").orderBy("lastTimestamp", "asc");

    if (userName) q = q.where("userName", "==", userName);

    const snap = await q.get();

    // 🔥 Flatten punches, attach userName + docId
    const punches = [];
    snap.forEach((doc) => {
      const data = doc.data();
      const name = data.userName || data.userId || "Unknown";
      (data.punches || []).forEach((p, idx) => {
        punches.push({
          id: `${doc.id}_${idx}`, // unique row ID
          userId: data.userId,
          userName: name,
          type: p.type,
          timestamp: p.timestamp,
          source: p.source || "unknown",
        });
      });
    });

    return res.json({ punches });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});




app.post("/admin/editPunch", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { punchId, type, timestampISO } = req.body;
    if (!punchId) return res.status(400).json({ error: "punchId required" });

    // Parse ID like "docId_index"
    const [docId, idxStr] = punchId.split("_");
    const punchIndex = parseInt(idxStr, 10);
    if (!docId || isNaN(punchIndex)) {
      return res.status(400).json({ error: "Invalid punchId format" });
    }

    const ref = db.collection("attendance").doc(docId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Punch record not found" });

    let data = snap.data();
    let punches = data.punches || [];

    if (!punches[punchIndex]) {
      return res.status(404).json({ error: "Punch index not found" });
    }

    // Update that punch
    punches[punchIndex] = {
      ...punches[punchIndex],
      type: type || punches[punchIndex].type,
      timestamp: timestampISO || punches[punchIndex].timestamp,
      editedBy: req.user.uid,
      editedAt: new Date().toISOString(),
    };

    await ref.update({ punches });

    return res.json({ success: true, punches });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


/* ================= Summary ================= */
function overlapHours(intervalA, intervalB) {
  const inter = intervalA.intersection(intervalB);
  return inter ? inter.toDuration(["hours"]).hours : 0;
}

app.post("/computeSummary", verifyToken, async (req, res) => {
  try {
    const targetUserId = req.body.userId || req.user.uid;
    const dateStr = req.body.date;
    if (!dateStr) return res.status(400).json({ error: "date required" });

    // ✅ fetch the schedule & timezone of the *target user* (not just the logged in one)
    const userDoc = (await getUserDoc(targetUserId)) || {
      timezone: "UTC",
      schedule: { start: "09:00", end: "18:00" },
      role: "employee",
    };

    const tz = userDoc.timezone || "UTC";
    const startOfDay = DateTime.fromISO(dateStr, { zone: tz }).startOf("day");
    const endOfDay = startOfDay.endOf("day");

    // 🔍 Get attendance punches
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
          let dt;
          if (p.timestamp.toDate) {
            dt = p.timestamp.toDate();
          } else if (typeof p.timestamp === "string") {
            dt = new Date(p.timestamp);
          } else if (p.timestamp._seconds) {
            dt = new Date(p.timestamp._seconds * 1000);
          }
          if (dt && !isNaN(dt)) {
            punches.push({
              type: p.type,
              localDateTime: DateTime.fromJSDate(dt).setZone(tz),
            });
          }
        });
      }
    });

    console.log("Punches found:", punches.map(p => ({
      type: p.type,
      ts: p.localDateTime.toISO()
    })));

    punches.sort((a, b) => a.localDateTime - b.localDateTime);

    // ✅ Build pairs (and close if still punched in)
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

    console.log("Pairs built:", pairs.map(pr => ({
      in: pr.in.toISO(),
      out: pr.out.toISO()
    })));

    // ✅ Schedule interval
    const sched = userDoc.schedule || { start: "09:00", end: "18:00" };
    const schedStart = DateTime.fromISO(`${dateStr}T${sched.start}`, { zone: tz });
    let schedEnd = DateTime.fromISO(`${dateStr}T${sched.end}`, { zone: tz });
    if (schedEnd <= schedStart) schedEnd = schedEnd.plus({ days: 1 });
    const schedInterval = Interval.fromDateTimes(schedStart, schedEnd);

    // ✅ Night diff 22:00–06:00
    const ndStart = DateTime.fromISO(`${dateStr}T22:00:00`, { zone: tz });
    const ndEnd = DateTime.fromISO(`${dateStr}T06:00:00`, { zone: tz }).plus({ days: 1 });
    const ndInterval = Interval.fromDateTimes(ndStart, ndEnd);

    // ✅ Totals
    let total = 0, regular = 0, overtime = 0, nd = 0, late = 0, undertime = 0;

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
    console.error("computeSummary error:", err);
    return res.status(500).json({ error: err.message });
  }
});


/* ================= Reports ================= */
app.post("/admin/weeklyReport", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, weekStart } = req.body;
    if (!weekStart) return res.status(400).json({ error: "weekStart required" });

    const start = DateTime.fromISO(weekStart);
    const end = start.plus({ days: 6 }).toISODate();

    let q = db.collection("dailySummary").where("date", ">=", weekStart).where("date", "<=", end);
    if (userId) q = q.where("userId", "==", userId);

    const snap = await q.get();
    const days = snap.docs.map((d) => d.data());

    const totals = { regularHours: 0, overtimeHours: 0, nightDiffHours: 0, lateMinutes: 0, undertimeMinutes: 0 };
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
    return res.status(500).json({ error: err.message });
  }
});

app.post("/admin/dailyReport", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "date required" });

    const snap = await db.collection("dailySummary").where("date", "==", date).get();
    return res.json({ date, report: snap.docs.map((d) => d.data()) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ================= Start ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
