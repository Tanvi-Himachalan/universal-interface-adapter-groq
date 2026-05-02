/**
 * ocrService.js — OCR Integration using Tesseract.js
 * Extracts text from images on the page, makes it readable and speakable.
 * Runs entirely client-side — no server needed.
 *
 * Usage: Import this in content.js or a page script.
 * Tesseract.js loads via CDN in the extension's web-accessible resources.
 */

/**
 * Load Tesseract.js dynamically from CDN.
 * We load it on-demand to avoid slowing down every page load.
 */
async function loadTesseract() {
  if (window.Tesseract) return window.Tesseract;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error("Failed to load Tesseract.js"));
    document.head.appendChild(script);
  });
}

/**
 * Extracts text from a single image element or URL.
 * @param {HTMLImageElement|string} imageOrUrl
 * @param {string} lang - Tesseract language code (e.g. 'eng', 'hin')
 * @returns {Promise<{text: string, confidence: number}>}
 */
async function extractTextFromImage(imageOrUrl, lang = "eng") {
  const Tesseract = await loadTesseract();

  const src = typeof imageOrUrl === "string" ? imageOrUrl : imageOrUrl.src;

  if (!src || src.startsWith("data:image/gif")) {
    return { text: "", confidence: 0 };
  }

  try {
    const result = await Tesseract.recognize(src, lang, {
      logger: () => {}, // Suppress verbose output
    });

    const text = result.data.text.trim();
    const confidence = result.data.confidence;

    return { text, confidence };
  } catch (err) {
    console.warn("OCR failed for image:", src.slice(0, 80), err.message);
    return { text: "", confidence: 0 };
  }
}

/**
 * Scans all images on the current page that lack alt text.
 * Runs OCR on each and adds an aria-label + tooltip with the extracted text.
 * @param {Function} onProgress - callback(processed, total)
 * @returns {Promise<Array<{img: HTMLImageElement, text: string}>>}
 */
async function processAllImages(onProgress) {
  const images = Array.from(document.querySelectorAll("img")).filter((img) => {
    // Skip: has alt text, is tiny (icon), or is a data URI gif
    const isIconSize = img.naturalWidth < 50 || img.naturalHeight < 50;
    const hasGoodAlt = img.alt && img.alt.trim().length > 3;
    return !hasGoodAlt && !isIconSize;
  });

  const results = [];
  let processed = 0;

  for (const img of images) {
    const { text, confidence } = await extractTextFromImage(img);
    processed++;

    if (onProgress) onProgress(processed, images.length);

    if (text && confidence > 50) {
      // Add accessible alt text
      img.alt = text;
      img.setAttribute("aria-label", `Image containing text: ${text}`);

      // Add visual tooltip
      img.title = `📷 OCR detected: ${text.slice(0, 200)}`;

      // Add a visible badge overlay
      addOCRBadge(img, text);

      results.push({ img, text, confidence });
    }
  }

  return results;
}

/**
 * Adds a small badge below an image showing the extracted text.
 */
function addOCRBadge(img, text) {
  // Avoid double-adding
  if (img.nextSibling?.classList?.contains("uia-ocr-badge")) return;

  const badge = document.createElement("div");
  badge.className = "uia-ocr-badge";
  badge.style.cssText = `
    display: inline-block;
    background: rgba(8, 11, 20, 0.9);
    color: #a5b4fc;
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 0 0 8px 8px;
    border: 1px solid rgba(99,102,241,0.3);
    border-top: none;
    max-width: ${img.offsetWidth || 200}px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    cursor: help;
  `;
  badge.textContent = `📷 ${text.slice(0, 80)}${text.length > 80 ? "..." : ""}`;
  badge.title = text; // Show full text on hover

  img.insertAdjacentElement("afterend", badge);
}

/**
 * Remove all OCR badges (called when OCR mode is disabled).
 */
function removeOCRBadges() {
  document.querySelectorAll(".uia-ocr-badge").forEach((el) => el.remove());
}

/**
 * Speak the text extracted from an image via Web Speech API.
 */
function speakImageText(text, lang = "en-US") {
  if (!text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`Image contains: ${text}`);
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// ─── TensorFlow.js Element Detection (Basic) ─────────────────────────────
/**
 * Uses TensorFlow.js COCO-SSD model to detect objects in images.
 * Provides semantic labels for images without alt text.
 *
 * This is a separate, heavier feature — load only when needed.
 */
async function detectObjectsInImage(imageElement) {
  // Dynamically load TF.js and COCO-SSD on demand
  if (!window.tf) {
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js");
  }
  if (!window.cocoSsd) {
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
  }

  try {
    const model = await window.cocoSsd.load();
    const predictions = await model.detect(imageElement);

    if (predictions.length === 0) return null;

    const labels = predictions
      .filter((p) => p.score > 0.5)
      .map((p) => `${p.class} (${Math.round(p.score * 100)}%)`)
      .join(", ");

    return `Detected objects: ${labels}`;
  } catch (err) {
    console.warn("TF object detection failed:", err.message);
    return null;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Export for use in content.js
if (typeof module !== "undefined") {
  module.exports = {
    extractTextFromImage,
    processAllImages,
    removeOCRBadges,
    speakImageText,
    detectObjectsInImage,
  };
}
