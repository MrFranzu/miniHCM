// backend/middleware/auth.js
import { admin } from "../firebaseAdmin.js";

export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: "Missing Authorization header" });

    const idToken = match[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded; // contains uid, email, possibly custom claims
    return next();
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(401).json({ error: "Invalid or expired token", details: err.message });
  }
}

export async function requireAdmin(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: "Missing user (not authenticated)" });

    // Option 1: custom claims (fast)
    if (req.user.admin === true) return next();

    // Option 2: Firestore users collection fallback
    const snap = await admin.firestore().collection("users").doc(req.user.uid).get();
    if (snap.exists && snap.data().role === "admin") return next();

    return res.status(403).json({ error: "Forbidden - admin only" });
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(500).json({ error: "Error checking admin", details: err.message });
  }
}
