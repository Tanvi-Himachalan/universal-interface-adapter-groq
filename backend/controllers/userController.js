/**
 * controllers/userController.js
 * Firebase Firestore user profile and preferences management.
 */

const { getFirestore } = require("../middleware/firebase");

// ─── POST /api/user/register ──────────────────────────────────────────────
async function register(req, res) {
  try {
    const db = getFirestore();
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Auth required" });

    await db.collection("users").doc(uid).set({
      email: req.user.email || "",
      preferences: { language: "en", speechRate: 0.9, fontSize: "normal" },
      modes: { lowVision: false, colorBlind: false, simpleMode: false, translateMode: false, voiceMode: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    res.json({ ok: true, uid });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
}

// ─── POST /api/user/login ─────────────────────────────────────────────────
async function login(req, res) {
  try {
    const db = getFirestore();
    const uid = req.user.uid;
    const doc = await db.collection("users").doc(uid).get();
    const profile = doc.exists ? doc.data() : { preferences: {}, modes: {} };
    res.json({ uid, email: req.user.email, ...profile });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
}

// ─── GET /api/user/profile ────────────────────────────────────────────────
async function getProfile(req, res) {
  try {
    const db = getFirestore();
    const uid = req.user.uid;

    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      // Return default profile for new users
      return res.json({
        uid,
        email: req.user.email,
        preferences: {
          language: "en",
          speechRate: 0.9,
          fontSize: "normal",
        },
        modes: {
          lowVision: false,
          colorBlind: false,
          simpleMode: false,
          translateMode: false,
          voiceMode: false,
        },
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ uid, ...doc.data() });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ error: "Failed to load profile" });
  }
}

// ─── POST /api/user/preferences ───────────────────────────────────────────
async function savePreferences(req, res) {
  try {
    const db = getFirestore();
    const uid = req.user.uid;
    const { preferences, modes } = req.body;

    // Validate preferences shape
    const allowedPrefKeys = ["language", "speechRate", "fontSize", "backendUrl"];
    const allowedModeKeys = ["lowVision", "colorBlind", "simpleMode", "translateMode", "voiceMode"];

    const cleanPrefs = {};
    if (preferences && typeof preferences === "object") {
      allowedPrefKeys.forEach((key) => {
        if (preferences[key] !== undefined) cleanPrefs[key] = preferences[key];
      });
    }

    const cleanModes = {};
    if (modes && typeof modes === "object") {
      allowedModeKeys.forEach((key) => {
        if (modes[key] !== undefined) cleanModes[key] = Boolean(modes[key]);
      });
    }

    await db
      .collection("users")
      .doc(uid)
      .set(
        {
          email: req.user.email,
          preferences: cleanPrefs,
          ...(Object.keys(cleanModes).length > 0 ? { modes: cleanModes } : {}),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    res.json({ ok: true, preferences: cleanPrefs });
  } catch (err) {
    console.error("Save preferences error:", err.message);
    res.status(500).json({ error: "Failed to save preferences" });
  }
}

// ─── DELETE /api/user/account ─────────────────────────────────────────────
async function deleteAccount(req, res) {
  try {
    const db = getFirestore();
    const uid = req.user.uid;

    // Delete all user data from Firestore
    await db.collection("users").doc(uid).delete();
    await db.collection("analytics").where("uid", "==", uid).get().then((snap) => {
      const batch = db.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      return batch.commit();
    });

    res.json({ ok: true, message: "Account and all data deleted" });
  } catch (err) {
    console.error("Delete account error:", err.message);
    res.status(500).json({ error: "Failed to delete account" });
  }
}

module.exports = { register, login, getProfile, savePreferences, deleteAccount };
