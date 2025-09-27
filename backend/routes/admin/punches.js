//api\admin\punches.js

import { admin, db } from "../../../backend/firebaseAdmin.js";
import { setCors } from "../../_cors.js";

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
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const decoded = await verifyToken(req);
    await requireAdmin(decoded);

    const { userName } = req.query;
    let q = db.collection("attendance").orderBy("lastTimestamp", "asc");
    if (userName) q = q.where("userName", "==", userName);

    const snap = await q.get();
    const punches = [];
    snap.forEach((doc) => {
      const data = doc.data();
      const name = data.userName || data.userId || "Unknown";
      (data.punches || []).forEach((p, idx) => {
        punches.push({
          id: `${doc.id}_${idx}`,
          userId: data.userId,
          userName: name,
          type: p.type,
          timestamp: p.timestamp,
          source: p.source || "unknown",
        });
      });
    });

    return res.status(200).json({ punches });
  } catch (err) {
    console.error("Admin punches error:", err);
    return res.status(500).json({ error: err.message });
  }
}
