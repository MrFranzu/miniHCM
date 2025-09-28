// backend/firebaseAdmin.js
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

function normalizePrivateKey(raw) {
  if (!raw) return null;
  // Trim surrounding quotes if present
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  // If key contains literal '\n' sequences, replace them with real newlines.
  // But if it already contains real newlines, leave them alone.
  if (key.includes("\\n") && !key.includes("\n")) {
    key = key.replace(/\\n/g, "\n");
  }
  return key;
}

let firebaseConfig = null;

// Prefer environment variables (production / env-based)
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = normalizePrivateKey(rawPrivateKey);

if (projectId && clientEmail && privateKey) {
  firebaseConfig = {
    projectId,
    clientEmail,
    privateKey,
  };
} else {
  // Fallback: try to load serviceAccountKey.json from backend folder
  const svcPath = path.resolve(new URL('.', import.meta.url).pathname, "serviceAccountKey.json");
  try {
    if (fs.existsSync(svcPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(svcPath, "utf8"));
      firebaseConfig = {
        projectId: serviceAccount.project_id || serviceAccount.projectId,
        clientEmail: serviceAccount.client_email || serviceAccount.clientEmail,
        privateKey: serviceAccount.private_key || serviceAccount.privateKey,
      };
    }
  } catch (err) {
    console.error("Failed to load serviceAccountKey.json fallback:", err);
  }
}

if (!admin.apps.length) {
  if (!firebaseConfig || !firebaseConfig.privateKey) {
    console.error(
      "FATAL: Firebase admin credentials are missing or malformed.\n" +
      "Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your .env\n" +
      "or place a valid serviceAccountKey.json in the backend folder."
    );
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
      });
      console.log("✅ Firebase admin initialized.");
    } catch (err) {
      console.error("Failed to initialize firebase-admin:", err);
    }
  }
}

export const db = admin.firestore();
export { admin };
