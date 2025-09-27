import { admin, db } from "../firebaseAdmin.js";
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

async function requireAdmin(decoded) {
  const userDoc = await getUserDoc(decoded.uid);
  if (!userDoc || userDoc.role !== "admin") throw new Error("Admin only");
  return userDoc;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const decoded = await verifyToken(req);
    await requireAdmin(decoded);

    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "date required" });

    const snap = await db.collection("dailySummary").where("date", "==", date).get();
    return res.status(200).json({ date, report: snap.docs.map((d) => d.data()) });
  } catch (err) {
    console.error("Daily report error:", err);
    return res.status(500).json({ error: err.message });
  }
}
