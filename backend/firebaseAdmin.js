import admin from "firebase-admin";

let db = null;

try {
  if (process.env.SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    db = admin.firestore();
    console.log("✅ Firebase initialized");
  } else {
    console.warn("⚠️ SERVICE_ACCOUNT_JSON not found");
  }
} catch (err) {
  console.error("❌ Firebase Admin init failed:", err.message);
}

export { admin, db };
