/**
 * middleware/firebase.js
 * Firebase Admin SDK singleton initialization.
 * Uses environment variables — never hardcode credentials.
 */

const admin = require("firebase-admin");

let initialized = false;

function initFirebase() {
  if (initialized) return;

  // Support both JSON file path and individual env vars
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // If service account JSON file path is set
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    // Use individual environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      console.warn(
        "⚠️  Firebase credentials not configured. User auth features will be disabled.\n" +
        "   Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env"
      );
      initialized = true;
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  initialized = true;
  console.info("✅ Firebase Admin SDK initialized");
}

function getAdmin() {
  initFirebase();
  return admin;
}

function getFirestore() {
  initFirebase();
  return admin.firestore();
}

// Initialize on module load
initFirebase();

module.exports = { getAdmin, getFirestore };
