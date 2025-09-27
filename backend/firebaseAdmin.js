// backend/firebaseAdmin.js
import admin from "firebase-admin";
import path from "path";
import fs from "fs";

const SERVICE_ACCOUNT_JSON = process.env.SERVICE_ACCOUNT_JSON;
const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH || path.join(process.cwd(), "backend", "serviceAccountKey.json");

let serviceAccount;

// Use JSON env var if provided (recommended for Vercel)
if (SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
  } catch (err) {
    console.error("Invalid SERVICE_ACCOUNT_JSON:", err.message);
    throw new Error("Invalid SERVICE_ACCOUNT_JSON");
  }
} else if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  try {
    serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  } catch (err) {
    console.error("Invalid serviceAccountKey.json:", err.message);
    throw new Error("Invalid serviceAccountKey.json");
  }
} else {
  // No service account found — on Vercel it's best to set SERVICE_ACCOUNT_JSON.
  // Throwing here so the function fails early and you can set proper env.
  throw new Error(
    "Missing Firebase service account. Set SERVICE_ACCOUNT_JSON env var (JSON string) or place backend/serviceAccountKey.json locally."
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export { admin, db };
