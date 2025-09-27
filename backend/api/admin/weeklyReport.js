import { admin, db } from "../../firebaseAdmin.js";
import { DateTime } from "luxon";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const decoded = await verifyToken(req);
    const userDoc = await getUserDoc(decoded.uid);
    if (!userDoc || userDoc.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

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

    return res.status(200).json(report);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
