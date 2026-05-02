/**
 * routes/ai.js — AI endpoint router
 */

const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { optionalAuth } = require("../middleware/auth");

// All AI routes use optional auth (works with or without Firebase token)
router.use(optionalAuth);

// POST /api/ai/simplify — Simplify complex text
router.post("/simplify", aiController.simplify);

// POST /api/ai/translate — Translate text to target language
router.post("/translate", aiController.translate);

// POST /api/ai/explain — Explain current page
router.post("/explain", aiController.explain);

// POST /api/ai/command — Interpret voice command
router.post("/command", aiController.interpretCommand);

module.exports = router;
