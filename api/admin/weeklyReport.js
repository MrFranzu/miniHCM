import { admin, db } from "../../backend/firebaseAdmin.js";
import { DateTime } from "luxon";
import { setCors } from "../_cors.js";

async function verifyToken(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new Error("Missing Authorization header");
  return admin.auth().verifyIdToken(match[1]);
}

async function requireAdmin(decoded) {
  const doc = await db.collection("users").doc(decoded.uid).get();
  const userDoc = doc.exists ? { id: doc.id, ...doc.data() } : null;
  if (!userDoc || userDoc.role !== "admin") throw new Error("Admin only");
  return userDoc;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const decoded = await verifyToken(req);
    await requireAdmin(decoded);

    const { userId, weekStart } = req.body;
    if (!weekStart) return res.status(400).json({ error: "weekStart required" });

    const start = DateTime.fromISO(weekStart);
    const end = start.plus({ days: 6 }).toISODate();

    let q = db.collection("dailySummary")
      .where("date", ">=", weekStart)
      .where("date", "<=", end);

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
    console.error("Weekly report error:", err);
    return res.status(500).json({ error: err.message });
  }
}
