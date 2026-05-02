/**
 * controllers/analyticsController.js
 * Tracks feature usage events in Firestore for product analytics.
 */

const { getFirestore } = require("../middleware/firebase");

const ALLOWED_EVENTS = [
  "extension_enabled",
  "extension_disabled",
  "mode_toggled",
  "page_explained",
  "voice_command_used",
  "text_simplified",
  "page_translated",
  "ocr_used",
];

async function track(req, res) {
  try {
    const { event, properties } = req.body;

    if (!event || !ALLOWED_EVENTS.includes(event)) {
      return res.status(400).json({ error: `Invalid event. Must be one of: ${ALLOWED_EVENTS.join(", ")}` });
    }

    const db = getFirestore();

    await db.collection("analytics").add({
      event,
      properties: properties || {},
      uid: req.user?.uid || "anonymous",
      timestamp: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || "",
    });

    res.json({ ok: true });
  } catch (err) {
    // Analytics failures should not affect the user
    console.error("Analytics error:", err.message);
    res.json({ ok: true });
  }
}

module.exports = { track };
