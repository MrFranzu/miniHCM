import admin from "firebase-admin";

let db = null;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  db = admin.firestore();
  console.log("✅ Firebase initialized");
} catch (err) {
  console.error("❌ Firebase Admin init failed:", err.message);
}

export { admin, db };
