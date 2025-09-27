import { admin, db } from "../backend/firebaseAdmin.js";
import { DateTime } from "luxon";
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


export default function handler(req, res) {
  res.status(200).json({ ok: true });
}





