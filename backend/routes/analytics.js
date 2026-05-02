/**
 * routes/analytics.js — Usage analytics
 */

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { optionalAuth } = require("../middleware/auth");

router.use(optionalAuth);

// POST /api/analytics/track — Track an event
router.post("/track", analyticsController.track);

module.exports = router;
