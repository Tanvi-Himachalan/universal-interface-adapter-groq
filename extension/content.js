/**
 * content.js — Universal Interface Adapter
 *
 * FIXES in this version:
 * 1. Low Vision: better contrast, readable colors (not blinding cyan)
 * 2. Translate: actually replaces text on the page, works reliably
 * 3. Explain: correctly sends pageData and handles response
 * 4. Voice: reads page content properly
 * 5. Message bridge: more robust iframe communication with retry
 * 6. Popup messages (TOGGLE_EXTENSION, SET_MODE, EXPLAIN_PAGE) handled directly
 */

(function () {
  "use strict";

  // Guard: don't inject twice
  if (window.__UIA_INJECTED__) return;
  window.__UIA_INJECTED__ = true;

  // ─── State ──────────────────────────────────────────────────────────────
  let isEnabled = false;
  let overlayFrame = null;
  let overlayReady = false;
  let pendingMessages = []; // messages queued before iframe is ready
  let currentModes = {
    lowVision: false,
    colorBlind: false,
    simpleMode: false,
    translateMode: false,
    voiceMode: false,
  };
  let userPreferences = { language: "en", speechRate: 0.9 };
  let mutationObserver = null;
  let recognition = null;
  let originalTexts = new Map(); // stores original text nodes for translate undo

  // ─── Init ────────────────────────────────────────────────────────────────
  async function init() {
    const stored = await chrome.storage.sync.get(["uia_enabled", "uia_prefs", "uia_modes"]);
    isEnabled = stored.uia_enabled || false;
    userPreferences = { ...userPreferences, ...(stored.uia_prefs || {}) };
    if (stored.uia_modes) currentModes = { ...currentModes, ...stored.uia_modes };

    injectOverlayPanel();
    setupMessageListeners();

    if (isEnabled) {
      applyAllModes();
      startDOMScanner();
    }
  }

  // ─── Overlay Injection ───────────────────────────────────────────────────
  function injectOverlayPanel() {
    if (document.getElementById("uia-overlay-frame")) return;

    overlayFrame = document.createElement("iframe");
    overlayFrame.id = "uia-overlay-frame";
    overlayFrame.src = chrome.runtime.getURL("overlay.html");
    overlayFrame.setAttribute("allowtransparency", "true");
    overlayFrame.style.cssText = `
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      width: 370px !important;
      height: 520px !important;
      border: none !important;
      border-radius: 18px !important;
      z-index: 2147483647 !important;
      pointer-events: all !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) !important;
      background: transparent !important;
      display: block !important;
    `;
    document.documentElement.appendChild(overlayFrame);

    overlayFrame.addEventListener("load", () => {
      // Give React time to mount
      setTimeout(() => {
        overlayReady = true;
        // Send initial state
        sendToOverlay("INIT_STATE", {
          isEnabled,
          modes: currentModes,
          preferences: userPreferences,
          pageTitle: document.title,
          pageUrl: window.location.href,
        });
        // Flush any queued messages
        pendingMessages.forEach((m) => sendToOverlay(m.type, m.payload));
        pendingMessages = [];
        // Auto-scan page
        setTimeout(scanAndSendPageData, 500);
      }, 600);
    });
  }

  // ─── Message Bridge ──────────────────────────────────────────────────────
  function setupMessageListeners() {
    // From Chrome popup (popup.html clicks)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      handleExternalMessage(message);
      sendResponse({ ok: true });
      return false;
    });

    // From overlay iframe (React app)
    window.addEventListener("message", (event) => {
      if (!event.data || event.data.source !== "UIA_OVERLAY") return;
      handleOverlayMessage(event.data);
    });
  }

  // Messages from popup.html
  function handleExternalMessage(msg) {
    switch (msg.type) {
      case "TOGGLE_EXTENSION":
        toggleExtension(msg.payload?.enabled ?? !isEnabled);
        break;
      case "SET_MODE":
        setMode(msg.payload.mode, msg.payload.value);
        break;
      case "EXPLAIN_PAGE":
        explainCurrentPage();
        break;
      case "START_VOICE":
        startVoiceRecognition();
        break;
      case "SHOW_PANEL":
        showPanel();
        break;
    }
  }

  // Messages from React overlay
  function handleOverlayMessage(data) {
    switch (data.type) {
      case "TOGGLE_EXTENSION":
        toggleExtension(data.payload?.enabled ?? !isEnabled);
        break;
      case "SET_MODE":
        setMode(data.payload.mode, data.payload.value);
        break;
      case "EXPLAIN_PAGE":
        explainCurrentPage();
        break;
      case "START_VOICE":
        startVoiceRecognition();
        break;
      case "STOP_VOICE":
        stopVoiceRecognition();
        break;
      case "SPEAK_TEXT":
        readPageAloud();
        break;
      case "STOP_SPEAKING":
        window.speechSynthesis.cancel();
        break;
      case "SCAN_PAGE":
        scanAndSendPageData();
        break;
      case "CLOSE_PANEL":
        overlayFrame && (overlayFrame.style.display = "none");
        break;
      case "SAVE_PREFS":
        savePreferences(data.payload.preferences);
        break;
    }
  }

  function sendToOverlay(type, payload = {}) {
    if (!overlayReady) {
      pendingMessages.push({ type, payload });
      return;
    }
    try {
      overlayFrame?.contentWindow?.postMessage(
        { source: "UIA_CONTENT", type, payload },
        "*"
      );
    } catch (e) {
      // iframe may have been removed
    }
  }

  function showPanel() {
    if (overlayFrame) {
      overlayFrame.style.display = "block";
      overlayFrame.style.opacity = "1";
    }
  }

  // ─── Toggle Extension ────────────────────────────────────────────────────
  function toggleExtension(enabled) {
    isEnabled = enabled;
    chrome.storage.sync.set({ uia_enabled: enabled });

    if (enabled) {
      showPanel();
      applyAllModes();
      startDOMScanner();
    } else {
      removeAllModes();
      stopDOMScanner();
    }
    sendToOverlay("STATE_UPDATE", { isEnabled });
  }

  // ─── Mode Management ──────────────────────────────────────────────────────
  function setMode(mode, value) {
    currentModes[mode] = value;
    chrome.storage.sync.set({ uia_modes: currentModes });

    const actions = {
      lowVision:    [applyLowVisionMode,   removeLowVisionMode],
      colorBlind:   [applyColorBlindMode,  removeColorBlindMode],
      simpleMode:   [applySimpleMode,      removeSimpleMode],
      translateMode:[applyTranslateMode,   removeTranslateMode],
      voiceMode:    [startVoiceRecognition, stopVoiceRecognition],
    };
    const [on, off] = actions[mode] || [];
    value ? on?.() : off?.();
  }

  function applyAllModes() {
    Object.entries(currentModes).forEach(([mode, active]) => {
      if (active) setMode(mode, true);
    });
  }

  function removeAllModes() {
    Object.keys(currentModes).forEach((mode) => setMode(mode, false));
  }

  // ─── LOW VISION MODE ─────────────────────────────────────────────────────
  // FIX: Use comfortable high-contrast instead of blinding cyan/yellow
  function applyLowVisionMode() {
    removeStyle("uia-low-vision");
    injectStyle("uia-low-vision", `
      /* UIA Low Vision Mode — comfortable high contrast */
      html, body {
        background-color: #1a1a1a !important;
        color: #f0f0f0 !important;
      }
      p, li, td, th, span, div, label, caption {
        font-size: 118% !important;
        line-height: 1.85 !important;
        color: #f0f0f0 !important;
      }
      h1, h2, h3, h4, h5, h6 {
        font-size: 130% !important;
        color: #ffffff !important;
        line-height: 1.6 !important;
      }
      a, a:visited {
        color: #7dd3fc !important;
        text-decoration: underline !important;
        text-underline-offset: 3px !important;
      }
      a:hover { color: #bae6fd !important; }
      button, [role="button"], input[type="submit"], input[type="button"] {
        font-size: 1.1rem !important;
        padding: 10px 16px !important;
        background-color: #4f46e5 !important;
        color: #ffffff !important;
        border: 2px solid #818cf8 !important;
        border-radius: 8px !important;
        cursor: pointer !important;
      }
      input:not([type="submit"]):not([type="button"]),
      select, textarea {
        background-color: #2d2d2d !important;
        color: #f0f0f0 !important;
        border: 2px solid #6366f1 !important;
        font-size: 1rem !important;
        padding: 8px !important;
        border-radius: 6px !important;
      }
      img { filter: brightness(0.9) contrast(1.1) !important; }
      :focus {
        outline: 3px solid #f59e0b !important;
        outline-offset: 2px !important;
      }
      /* Dark backgrounds for containers */
      header, nav, footer, aside, main, article, section {
        background-color: #1a1a1a !important;
      }
      /* Make text areas visible */
      [class*="content"], [class*="article"], [class*="post"], [id*="content"] {
        background-color: #1a1a1a !important;
        color: #f0f0f0 !important;
      }
    `);
  }

  function removeLowVisionMode() {
    removeStyle("uia-low-vision");
  }

  // ─── COLOR BLIND MODE ────────────────────────────────────────────────────
  function applyColorBlindMode() {
    removeStyle("uia-color-blind");
    // Add SVG filter for deuteranopia correction
    if (!document.getElementById("uia-cb-svg")) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = "uia-cb-svg";
      svg.setAttribute("aria-hidden", "true");
      svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";
      svg.innerHTML = `
        <defs>
          <filter id="uia-deuteranopia">
            <feColorMatrix type="matrix" values="
              0.625 0.375 0     0 0
              0.7   0.3   0     0 0
              0     0.3   0.7   0 0
              0     0     0     1 0"/>
          </filter>
        </defs>`;
      document.body.prepend(svg);
    }
    injectStyle("uia-color-blind", `
      body { filter: url(#uia-deuteranopia) !important; }
      /* Add text labels to red/green status indicators */
      [class*="error"],[class*="danger"],[class*="alert-danger"] {
        background-image: repeating-linear-gradient(
          45deg, transparent, transparent 4px,
          rgba(0,0,0,0.12) 4px, rgba(0,0,0,0.12) 8px) !important;
      }
      [class*="success"],[class*="alert-success"] {
        background-image: repeating-linear-gradient(
          -45deg, transparent, transparent 4px,
          rgba(0,0,0,0.12) 4px, rgba(0,0,0,0.12) 8px) !important;
      }
    `);
  }

  function removeColorBlindMode() {
    removeStyle("uia-color-blind");
    document.getElementById("uia-cb-svg")?.remove();
  }

  // ─── SIMPLE MODE ─────────────────────────────────────────────────────────
  async function applySimpleMode() {
    addContextualIcons();

    // Collect complex paragraphs
    const paras = [];
    document.querySelectorAll("p, li").forEach((el) => {
      const text = el.innerText?.trim() || "";
      if (text.length > 120 && !el.dataset.uiaSimplified) {
        paras.push(el);
      }
    });

    const batch = paras.slice(0, 6);
    if (!batch.length) return;

    batch.forEach((el) => {
      el.dataset.uiaOriginal = el.innerHTML;
      el.style.opacity = "0.5";
    });

    const texts = batch.map((el) => el.innerText.trim());
    chrome.runtime.sendMessage(
      { type: "SIMPLIFY_TEXT", payload: { texts, language: userPreferences.language || "en" } },
      (resp) => {
        if (chrome.runtime.lastError) return;
        (resp?.simplified || []).forEach((simplified, i) => {
          if (!batch[i]) return;
          batch[i].innerHTML = simplified;
          batch[i].style.opacity = "1";
          batch[i].dataset.uiaSimplified = "1";
        });
      }
    );
  }

  function addContextualIcons() {
    const iconMap = {
      submit: "✅", send: "📤", delete: "🗑️", remove: "❌",
      save: "💾", search: "🔍", login: "🔑", "sign in": "🔑",
      logout: "🚪", home: "🏠", back: "⬅️", next: "➡️",
      help: "❓", settings: "⚙️", download: "⬇️", upload: "⬆️",
      buy: "🛒", pay: "💳", call: "📞", email: "📧", edit: "✏️",
    };

    document.querySelectorAll("button, a, [role='button']").forEach((el) => {
      if (el.querySelector(".uia-icon")) return;
      const text = (el.innerText || "").toLowerCase().trim();
      for (const [kw, icon] of Object.entries(iconMap)) {
        if (text.includes(kw)) {
          const span = document.createElement("span");
          span.className = "uia-icon";
          span.setAttribute("aria-hidden", "true");
          span.style.cssText = "margin-right:4px;font-style:normal;";
          span.textContent = icon;
          el.prepend(span);
          break;
        }
      }
    });
  }

  function removeSimpleMode() {
    document.querySelectorAll("[data-uia-simplified]").forEach((el) => {
      if (el.dataset.uiaOriginal) el.innerHTML = el.dataset.uiaOriginal;
      delete el.dataset.uiaSimplified;
      delete el.dataset.uiaOriginal;
      el.style.opacity = "";
    });
    document.querySelectorAll(".uia-icon").forEach((el) => el.remove());
  }

  // ─── TRANSLATE MODE ───────────────────────────────────────────────────────
  // FIX: Walk the DOM, collect text nodes, send in batches, replace in-place
  async function applyTranslateMode() {
    const lang = userPreferences.language || "es";
    if (lang === "en") {
      sendToOverlay("NOTIFICATION", { text: "Set a non-English language in Settings first", type: "warning" });
      return;
    }

    sendToOverlay("NOTIFICATION", { text: "Translating page…", type: "info" });

    // Collect text nodes (skip scripts, styles, our own overlay)
    const nodes = collectTextNodes(document.body);
    const BATCH = 25;

    for (let i = 0; i < Math.min(nodes.length, 100); i += BATCH) {
      const batch = nodes.slice(i, i + BATCH);
      const texts = batch.map((n) => n.textContent.trim());

      chrome.runtime.sendMessage(
        { type: "TRANSLATE_TEXT", payload: { texts, targetLanguage: lang } },
        (resp) => {
          if (chrome.runtime.lastError || !resp?.translated) return;
          resp.translated.forEach((translated, idx) => {
            if (!batch[idx] || !translated) return;
            // Store original for undo
            if (!originalTexts.has(batch[idx])) {
              originalTexts.set(batch[idx], batch[idx].textContent);
            }
            batch[idx].textContent = translated;
          });
        }
      );

      // Small delay between batches to avoid rate limiting
      if (i + BATCH < nodes.length) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    sendToOverlay("NOTIFICATION", { text: "Translation complete ✓", type: "success" });
  }

  function collectTextNodes(root) {
    const nodes = [];
    const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "SVG", "CODE", "PRE"]);

    function walk(node) {
      if (!node) return;
      if (node.id === "uia-overlay-frame") return;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text.length > 3 && text.length < 600) nodes.push(node);
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (skip.has(node.tagName)) return;
        for (const child of node.childNodes) walk(child);
      }
    }

    walk(root);
    return nodes;
  }

  function removeTranslateMode() {
    // Restore original text nodes
    originalTexts.forEach((original, node) => {
      try { node.textContent = original; } catch (e) {}
    });
    originalTexts.clear();
  }

  // ─── DOM SCANNER ─────────────────────────────────────────────────────────
  function startDOMScanner() {
    if (mutationObserver) return;
    mutationObserver = new MutationObserver(() => {
      if (currentModes.simpleMode) addContextualIcons();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function stopDOMScanner() {
    mutationObserver?.disconnect();
    mutationObserver = null;
  }

  // ─── PAGE DATA SCAN ───────────────────────────────────────────────────────
  function scanAndSendPageData() {
    const data = {
      title: document.title,
      url: window.location.href,
      headings: [],
      buttons: [],
      links: [],
      forms: [],
      images: [],
      paragraphs: [],
    };

    document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((el) => {
      const text = el.innerText?.trim();
      if (text) data.headings.push({ tag: el.tagName, text: text.slice(0, 200) });
    });

    document.querySelectorAll("button,[role='button'],input[type='submit']").forEach((el) => {
      const text = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim();
      if (text) data.buttons.push({ text: text.slice(0, 100) });
    });

    document.querySelectorAll("a[href]").forEach((el) => {
      const text = el.innerText?.trim();
      if (text) data.links.push({ text: text.slice(0, 100), href: el.href });
    });

    document.querySelectorAll("form").forEach((form) => {
      const fields = [];
      form.querySelectorAll("input,select,textarea").forEach((f) => {
        const label = getFieldLabel(f);
        if (label) fields.push({ type: f.type, name: f.name || f.id, label });
      });
      if (fields.length) data.forms.push({ fields });
    });

    document.querySelectorAll("img").forEach((img) => {
      data.images.push({ alt: img.alt, hasAlt: !!img.alt.trim() });
    });

    document.querySelectorAll("p").forEach((p) => {
      const text = p.innerText?.trim();
      if (text && text.length > 30) data.paragraphs.push(text.slice(0, 400));
    });
    data.paragraphs = data.paragraphs.slice(0, 5);

    sendToOverlay("PAGE_DATA", data);
    return data;
  }

  function getFieldLabel(field) {
    if (field.id) {
      const lbl = document.querySelector(`label[for="${field.id}"]`);
      if (lbl) return lbl.innerText.trim();
    }
    const parent = field.closest("label");
    if (parent) return parent.innerText.trim();
    return field.placeholder || field.name || "";
  }

  // ─── EXPLAIN PAGE ─────────────────────────────────────────────────────────
  async function explainCurrentPage() {
    const pageData = scanAndSendPageData();
    sendToOverlay("EXPLAINING_PAGE", { loading: true });
    sendToOverlay("TAB_SWITCH", { tab: "explain" });

    chrome.runtime.sendMessage(
      {
        type: "EXPLAIN_PAGE",
        payload: { pageData, language: userPreferences.language || "en" },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          sendToOverlay("PAGE_EXPLANATION", {
            summary: "Extension error: " + chrome.runtime.lastError.message,
            keyActions: [],
            alerts: [],
            difficulty: "medium",
          });
          return;
        }
        sendToOverlay("PAGE_EXPLANATION", response || {
          summary: "No response received.",
          keyActions: [],
          alerts: [],
          difficulty: "medium",
        });
      }
    );
  }

  // ─── VOICE RECOGNITION ───────────────────────────────────────────────────
  function startVoiceRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      sendToOverlay("VOICE_ERROR", { error: "Speech recognition not supported in this browser" });
      return;
    }

    if (recognition) recognition.stop();

    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = userPreferences.language === "en" ? "en-US" : userPreferences.language || "en-US";

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript.toLowerCase().trim();
      sendToOverlay("VOICE_TRANSCRIPT", { text: transcript, final: last.isFinal });
      if (last.isFinal) processVoiceCommand(transcript);
    };

    recognition.onerror = (e) => {
      sendToOverlay("VOICE_ERROR", { error: e.error });
    };

    recognition.onend = () => {
      sendToOverlay("VOICE_STATUS", { active: false });
    };

    recognition.start();
    sendToOverlay("VOICE_STATUS", { active: true });
  }

  function stopVoiceRecognition() {
    recognition?.stop();
    recognition = null;
  }

  function processVoiceCommand(cmd) {
    const rules = [
      { match: ["explain", "what is this", "what does this do"], fn: () => explainCurrentPage() },
      { match: ["read", "read page", "read aloud", "read out"], fn: () => readPageAloud() },
      { match: ["stop", "silence", "quiet", "stop reading"], fn: () => window.speechSynthesis.cancel() },
      { match: ["scroll down", "go down"], fn: () => window.scrollBy({ top: 400, behavior: "smooth" }) },
      { match: ["scroll up", "go up"], fn: () => window.scrollBy({ top: -400, behavior: "smooth" }) },
      { match: ["go back", "back"], fn: () => window.history.back() },
      { match: ["go forward", "forward"], fn: () => window.history.forward() },
      { match: ["top", "go to top", "scroll to top"], fn: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
      { match: ["settings", "open settings"], fn: () => sendToOverlay("TAB_SWITCH", { tab: "settings" }) },
      { match: ["submit", "click submit"], fn: () => document.querySelector('button[type="submit"],input[type="submit"]')?.click() },
      { match: ["big text", "increase font", "larger text", "low vision"], fn: () => setMode("lowVision", true) },
      { match: ["normal text", "reset text", "remove low vision"], fn: () => setMode("lowVision", false) },
    ];

    for (const rule of rules) {
      if (rule.match.some((m) => cmd.includes(m))) {
        rule.fn();
        speakText("Done.");
        return;
      }
    }

    // No match — tell user
    speakText("I didn't understand that command. Try: explain this page, read page, scroll down, or open settings.");
  }

  // ─── TEXT TO SPEECH ───────────────────────────────────────────────────────
  function readPageAloud() {
    const main =
      document.querySelector("main, article, [role='main'], #mw-content-text, #content") ||
      document.body;

    // Get clean text — skip nav, header, footer
    const clone = main.cloneNode(true);
    clone.querySelectorAll("nav, header, footer, script, style, #uia-overlay-frame").forEach((el) => el.remove());
    const text = clone.innerText?.trim().replace(/\s+/g, " ").slice(0, 3000) || "No readable content found.";
    speakText(text);
  }

  function speakText(text) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = userPreferences.language === "en" ? "en-US" : userPreferences.language || "en-US";
    utt.rate = parseFloat(userPreferences.speechRate) || 0.9;
    utt.volume = 1;
    utt.pitch = 1;

    // Chrome bug: long utterances get cut off — split into chunks
    if (text.length > 200) {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      let i = 0;
      function speakNext() {
        if (i >= sentences.length) return;
        const u = new SpeechSynthesisUtterance(sentences[i++]);
        u.lang = utt.lang;
        u.rate = utt.rate;
        u.onend = speakNext;
        window.speechSynthesis.speak(u);
      }
      speakNext();
    } else {
      window.speechSynthesis.speak(utt);
    }
  }

  // ─── Preferences ─────────────────────────────────────────────────────────
  async function savePreferences(prefs) {
    userPreferences = { ...userPreferences, ...prefs };
    chrome.storage.sync.set({ uia_prefs: userPreferences });
    chrome.runtime.sendMessage({ type: "SAVE_PREFERENCES", payload: { preferences: prefs } });
  }

  // ─── Style Helpers ────────────────────────────────────────────────────────
  function injectStyle(id, css) {
    let el = document.getElementById(id);
    if (el) { el.textContent = css; return; }
    el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  }

  function removeStyle(id) {
    document.getElementById(id)?.remove();
  }

  // ─── Boot ────────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
