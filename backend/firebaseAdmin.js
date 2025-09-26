// backend/firebaseAdmin.js
import admin from "firebase-admin";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Missing serviceAccountKey.json. Put it and set SERVICE_ACCOUNT_PATH in .env");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

export { admin, db };
