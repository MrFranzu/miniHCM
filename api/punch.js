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

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const decoded = await verifyToken(req);
    const { type } = req.body;

    if (!["in", "out"].includes(type)) {
      return res.status(400).json({ error: "type must be 'in' or 'out'" });
    }

    const userDoc =
      (await getUserDoc(decoded.uid)) || {
        timezone: "UTC",
        schedule: { start: "09:00", end: "18:00" },
        role: "employee",
        name: decoded.email,
      };

    const tz = userDoc.timezone || "UTC";
    const now = DateTime.now().setZone(tz);
    const dateStr = now.toISODate();

    const ref = db.collection("attendance").doc(`${decoded.uid}_${dateStr}`);
    const docSnap = await ref.get();
    const data = docSnap.data();

    if (data?.punches?.length) {
      const last = data.punches[data.punches.length - 1];
      if (last.type === type) {
        return res.status(400).json({
          error: `Already punched ${type}, must punch ${type === "in" ? "out" : "in"} next.`,
        });
      }
    } else if (type === "out") {
      return res.status(400).json({ error: "Cannot punch out before punching in." });
    }

    const userName = userDoc.name || userDoc.fullName || decoded.email;

    const punch = {
      type,
      timestamp: admin.firestore.Timestamp.fromDate(now.toUTC().toJSDate()),
      source: "web",
      userId: decoded.uid,
      userName,
    };

    await ref.set(
      {
        userId: decoded.uid,
        userName,
        date: dateStr,
        lastTimestamp: punch.timestamp,
        punches: admin.firestore.FieldValue.arrayUnion(punch),
      },
      { merge: true }
    );

    return res.status(200).json({ success: true, punch });
  } catch (err) {
    console.error("Punch error:", err);
    return res.status(500).json({ error: err.message });
  }
}
