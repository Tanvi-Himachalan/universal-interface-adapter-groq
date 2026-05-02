/**
 * routes/user.js — User profile and preferences
 */

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// POST /api/user/register — create Firestore user doc after Firebase signup
router.post("/register", optionalAuth, userController.register);

// POST /api/user/login — validate token and return profile
router.post("/login", requireAuth, userController.login);

// GET /api/user/profile — Get user profile + preferences
router.get("/profile", requireAuth, userController.getProfile);

// POST /api/user/preferences — Save preferences to Firestore
router.post("/preferences", requireAuth, userController.savePreferences);

// DELETE /api/user/account — Delete user account + data
router.delete("/account", requireAuth, userController.deleteAccount);

module.exports = router;
