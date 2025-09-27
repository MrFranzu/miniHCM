import { admin, db } from "../../backend/firebaseAdmin.js";
import { DateTime, Interval } from "luxon";
import { setCors } from "./_cors.js";

async function verifyToken(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new Error("Missing Authorization header");
  return admin.auth().verifyIdToken(match[1]);
}

async function getUserDoc(uid) {
  const doc = await db.collection("users").doc(uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

function overlapHours(intervalA, intervalB) {
  const inter = intervalA.intersection(intervalB);
  return inter ? inter.toDuration(["hours"]).hours : 0;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const decoded = await verifyToken(req);
    const targetUserId = req.body.userId || decoded.uid;
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
      (data.punches || []).forEach((p) => {
        let dt;
        if (p.timestamp?.toDate) dt = p.timestamp.toDate();
        else if (typeof p.timestamp === "string") dt = new Date(p.timestamp);
        else if (p.timestamp?._seconds) dt = new Date(p.timestamp._seconds * 1000);
        if (dt && !isNaN(dt)) {
          punches.push({
            type: p.type,
            localDateTime: DateTime.fromJSDate(dt).setZone(tz),
          });
        }
      });
    });

    punches.sort((a, b) => a.localDateTime - b.localDateTime);

    const pairs = [];
    let currentIn = null;
    for (const p of punches) {
      if (p.type === "in") currentIn = p;
      else if (p.type === "out" && currentIn) {
        pairs.push({ in: currentIn.localDateTime, out: p.localDateTime });
        currentIn = null;
      }
    }
    if (currentIn) pairs.push({ in: currentIn.localDateTime, out: endOfDay });

    const sched = userDoc.schedule || { start: "09:00", end: "18:00" };
    const schedStart = DateTime.fromISO(`${dateStr}T${sched.start}`, { zone: tz });
    let schedEnd = DateTime.fromISO(`${dateStr}T${sched.end}`, { zone: tz });
    if (schedEnd <= schedStart) schedEnd = schedEnd.plus({ days: 1 });
    const schedInterval = Interval.fromDateTimes(schedStart, schedEnd);

    const ndStart = DateTime.fromISO(`${dateStr}T22:00:00`, { zone: tz });
    const ndEnd = DateTime.fromISO(`${dateStr}T06:00:00`, { zone: tz }).plus({ days: 1 });
    const ndInterval = Interval.fromDateTimes(ndStart, ndEnd);

    let total = 0, regular = 0, overtime = 0, nd = 0;
    for (const { in: inDt, out: outDt } of pairs) {
      const workInt = Interval.fromDateTimes(inDt, outDt);
      const hours = workInt.toDuration(["hours"]).hours;
      total += hours;
      const regularHrs = overlapHours(workInt, schedInterval);
      regular += regularHrs;
      overtime += Math.max(0, hours - regularHrs);
      nd += overlapHours(workInt, ndInterval);
    }

    const summary = {
      userId: targetUserId,
      userName: userDoc.name || userDoc.fullName || decoded.email,
      date: dateStr,
      timezone: tz,
      totalWorkedHours: +total.toFixed(2),
      regularHours: +regular.toFixed(2),
      overtimeHours: +overtime.toFixed(2),
      nightDiffHours: +nd.toFixed(2),
      generatedAt: admin.firestore.Timestamp.now(),
    };

    await db
      .collection("dailySummary")
      .doc(`${targetUserId}_${dateStr}`)
      .set(summary);

    return res.status(200).json(summary);
  } catch (err) {
    console.error("computeSummary error:", err);
    return res.status(500).json({ error: err.message });
  }
}
