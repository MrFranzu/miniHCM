//api\admin\dailyReport.js

import { admin, db } from "../../../backend/firebaseAdmin.js";
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

    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "date required" });

    const snap = await db.collection("dailySummary").where("date", "==", date).get();
    const report = snap.docs.map((d) => d.data());

    return res.status(200).json({ date, report });
  } catch (err) {
    console.error("Daily report error:", err);
    return res.status(500).json({ error: err.message });
  }
}
