/**
 * firebase.client.js — Firebase Client SDK
 * Used in the extension popup and overlay for:
 *  - User sign-in (Google / Email)
 *  - Getting ID tokens to send to the backend
 *  - Listening to auth state changes
 *
 * IMPORTANT: These are PUBLIC client-side keys (safe to expose).
 * All sensitive operations use the Admin SDK on the backend.
 *
 * HOW TO GET THESE VALUES:
 *  Firebase Console → Project Settings → General → Your apps → Web app
 *  Click "Add app" (</>) if you haven't created a web app yet.
 */

// ─── Your Firebase Web App Config ────────────────────────────────────────
// Replace these with your actual values from Firebase Console
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// ─── Dynamic Firebase SDK Loading ────────────────────────────────────────
// We load Firebase from CDN to keep the extension bundle small
let _app = null;
let _auth = null;

async function loadFirebase() {
  if (_app) return { app: _app, auth: _auth };

  // Load Firebase modules dynamically
  const { initializeApp } = await import(
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"
  );
  const {
    getAuth,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
  } = await import(
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"
  );

  _app = initializeApp(FIREBASE_CONFIG);
  _auth = getAuth(_app);

  return {
    app: _app,
    auth: _auth,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
  };
}

// ─── Auth Functions ───────────────────────────────────────────────────────

/**
 * Sign in with Google (opens popup).
 * Stores the ID token in chrome.storage.local for background.js to use.
 */
async function signInWithGoogle() {
  const firebase = await loadFirebase();
  const provider = new firebase.GoogleAuthProvider();

  const result = await firebase.signInWithPopup(firebase.auth, provider);
  const token = await result.user.getIdToken();

  // Store token and user info for background.js
  await chrome.storage.local.set({
    uia_token: token,
    uia_user: {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    },
  });

  return result.user;
}

/**
 * Sign in with email + password.
 */
async function signInWithEmail(email, password) {
  const firebase = await loadFirebase();

  const result = await firebase.signInWithEmailAndPassword(
    firebase.auth,
    email,
    password
  );
  const token = await result.user.getIdToken();

  await chrome.storage.local.set({
    uia_token: token,
    uia_user: {
      uid: result.user.uid,
      email: result.user.email,
    },
  });

  return result.user;
}

/**
 * Create a new account with email + password.
 */
async function registerWithEmail(email, password) {
  const firebase = await loadFirebase();

  const result = await firebase.createUserWithEmailAndPassword(
    firebase.auth,
    email,
    password
  );
  const token = await result.user.getIdToken();

  await chrome.storage.local.set({
    uia_token: token,
    uia_user: { uid: result.user.uid, email: result.user.email },
  });

  return result.user;
}

/**
 * Sign out and clear stored credentials.
 */
async function signOutUser() {
  const firebase = await loadFirebase();
  await firebase.signOut(firebase.auth);
  await chrome.storage.local.remove(["uia_token", "uia_user"]);
}

/**
 * Get a fresh ID token (tokens expire after 1 hour — this refreshes automatically).
 * Call this before any authenticated backend request.
 */
async function getFreshToken() {
  const firebase = await loadFirebase();
  const user = firebase.auth.currentUser;
  if (!user) return null;

  const token = await user.getIdToken(/* forceRefresh */ true);
  await chrome.storage.local.set({ uia_token: token });
  return token;
}

/**
 * Listen to auth state changes.
 * @param {Function} callback - called with (user | null)
 */
async function onAuthChanged(callback) {
  const firebase = await loadFirebase();
  return firebase.onAuthStateChanged(firebase.auth, callback);
}

// Export for use in popup scripts
if (typeof window !== "undefined") {
  window.UIAAuth = {
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    signOutUser,
    getFreshToken,
    onAuthChanged,
  };
}

export {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  signOutUser,
  getFreshToken,
  onAuthChanged,
};
