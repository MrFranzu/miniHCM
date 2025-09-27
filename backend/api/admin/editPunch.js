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

    const { punchId, type, timestampISO } = req.body;
    if (!punchId) return res.status(400).json({ error: "punchId required" });

    const [docId, idxStr] = punchId.split("_");
    const punchIndex = parseInt(idxStr, 10);
    if (!docId || isNaN(punchIndex)) {
      return res.status(400).json({ error: "Invalid punchId format" });
    }

    const ref = db.collection("attendance").doc(docId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Punch record not found" });

    const data = snap.data();
    const punches = data.punches || [];
    if (!punches[punchIndex]) {
      return res.status(404).json({ error: "Punch index not found" });
    }

    punches[punchIndex] = {
      ...punches[punchIndex],
      type: type || punches[punchIndex].type,
      timestamp: timestampISO || punches[punchIndex].timestamp,
      editedBy: decoded.uid,
      editedAt: new Date().toISOString(),
    };

    await ref.update({ punches });
    return res.status(200).json({ success: true, punches });
  } catch (err) {
    console.error("Edit punch error:", err);
    return res.status(500).json({ error: err.message });
  }
}
