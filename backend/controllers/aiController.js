/**
 * controllers/aiController.js
 * Validates requests, calls aiService, returns shaped responses.
 */

const aiService = require("../../ai/aiService");

// ─── POST /api/ai/simplify ────────────────────────────────────────────────
async function simplify(req, res) {
  try {
    const { texts, language } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "texts must be a non-empty array" });
    }

    if (texts.length > 20) {
      return res.status(400).json({ error: "Maximum 20 texts per request" });
    }

    // Validate text lengths
    const oversized = texts.filter((t) => typeof t !== "string" || t.length > 2000);
    if (oversized.length > 0) {
      return res.status(400).json({ error: "Each text must be a string under 2000 chars" });
    }

    const result = await aiService.simplifyTexts(texts, language || "en");
    res.json(result);
  } catch (err) {
    console.error("Simplify error:", err.message);
    res.status(500).json({ error: "Failed to simplify text", simplified: req.body.texts });
  }
}

// ─── POST /api/ai/translate ───────────────────────────────────────────────
async function translate(req, res) {
  try {
    const { texts, targetLanguage } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "texts must be a non-empty array" });
    }

    if (!targetLanguage || typeof targetLanguage !== "string") {
      return res.status(400).json({ error: "targetLanguage is required" });
    }

    if (texts.length > 30) {
      return res.status(400).json({ error: "Maximum 30 texts per request" });
    }

    const result = await aiService.translateTexts(texts, targetLanguage);
    res.json(result);
  } catch (err) {
    console.error("Translate error:", err.message);
    res.status(500).json({ error: "Translation failed", translated: req.body.texts });
  }
}

// ─── POST /api/ai/explain ─────────────────────────────────────────────────
async function explain(req, res) {
  try {
    const { pageData, language } = req.body;

    if (!pageData || typeof pageData !== "object") {
      return res.status(400).json({ error: "pageData object is required" });
    }

    // Sanitize pageData — strip any script content
    const safe = {
      title: String(pageData.title || "").slice(0, 200),
      url: String(pageData.url || "").slice(0, 500),
      headings: (pageData.headings || []).slice(0, 10).map((h) => ({
        tag: h.tag,
        text: String(h.text || "").slice(0, 200),
      })),
      buttons: (pageData.buttons || []).slice(0, 15).map((b) => ({
        text: String(b.text || "").slice(0, 100),
      })),
      links: (pageData.links || []).slice(0, 15).map((l) => ({
        text: String(l.text || "").slice(0, 100),
        href: String(l.href || "").slice(0, 200),
      })),
      forms: (pageData.forms || []).slice(0, 5),
      images: (pageData.images || []).slice(0, 20).map((i) => ({
        alt: String(i.alt || "").slice(0, 100),
        hasAlt: i.hasAlt,
      })),
      paragraphs: (pageData.paragraphs || []).slice(0, 3).map((p) => String(p).slice(0, 400)),
    };

    const result = await aiService.explainPage(safe, language || "en");
    res.json(result);
  } catch (err) {
    console.error("Explain error:", err.message);
    res.status(500).json({
      error: "Could not analyze page",
      summary: "Unable to analyze this page right now. Please try again.",
      keyActions: [],
      alerts: [],
      difficulty: "medium",
    });
  }
}

// ─── POST /api/ai/command ─────────────────────────────────────────────────
async function interpretCommand(req, res) {
  try {
    const { command, pageData } = req.body;

    if (!command || typeof command !== "string" || command.length > 500) {
      return res.status(400).json({ error: "command must be a string under 500 chars" });
    }

    const result = await aiService.interpretVoiceCommand(command, pageData || {});
    res.json(result);
  } catch (err) {
    console.error("Command error:", err.message);
    res.status(500).json({ action: null });
  }
}

module.exports = { simplify, translate, explain, interpretCommand };
