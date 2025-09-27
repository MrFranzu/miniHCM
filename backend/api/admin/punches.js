import { db } from "../../firebaseAdmin.js";
import { admin } from "../../firebaseAdmin.js";

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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const decoded = await verifyToken(req);
    const userDoc = await getUserDoc(decoded.uid);
    if (!userDoc || userDoc.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

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
    return res.status(500).json({ error: err.message });
  }
}
