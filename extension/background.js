/**
 * background.js — Universal Interface Adapter Service Worker
 * Now using Groq API (FREE, no credit card, 14,400 req/day)
 * Get your free key at: https://console.groq.com
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((result) => sendResponse(result))
    .catch((err) => {
      console.error("[UIA Background] Error:", err.message);
      sendResponse({ error: err.message });
    });
  return true;
});

async function handleMessage(message) {
  switch (message.type) {
    case "EXPLAIN_PAGE":      return await explainPage(message.payload);
    case "SIMPLIFY_TEXT":     return await simplifyText(message.payload);
    case "TRANSLATE_TEXT":    return await translateText(message.payload);
    case "INTERPRET_COMMAND": return await interpretVoiceCommand(message.payload);
    case "SAVE_PREFERENCES":  return await savePreferences(message.payload);
    case "GET_PREFERENCES":   return await getPreferences();
    default: return { error: "Unknown message type: " + message.type };
  }
}

// ─── API Key ──────────────────────────────────────────────────────────────
async function getApiKey() {
  const stored = await chrome.storage.sync.get("uia_groq_key");
  return stored.uia_groq_key || "";
}

// ─── Groq caller ─────────────────────────────────────────────────────────
// Uses llama-3.1-8b-instant: 14,400 req/day free, very fast
const GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(prompt) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    const err = await response.json().catch(() => ({}));
    throw new Error("Invalid API key — " + (err?.error?.message || response.status));
  }

  if (response.status === 429) {
    const err = await response.json().catch(() => ({}));
    throw new Error("Rate limit reached — " + (err?.error?.message || "try again in a moment"));
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Groq API error " + response.status);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callGroqJSON(prompt) {
  const raw = await callGroq(prompt);
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// ─── Explain Page ─────────────────────────────────────────────────────────
async function explainPage({ pageData, language }) {
  try {
    const { title, url, headings, buttons, links, forms, paragraphs } = pageData;
    const context = `Page: ${title||"Unknown"} (${url||""})
Headings: ${headings?.slice(0,5).map(h=>h.text).join(" | ")||"none"}
Buttons: ${buttons?.slice(0,8).map(b=>b.text).filter(Boolean).join(", ")||"none"}
Links: ${links?.slice(0,6).map(l=>l.text).filter(Boolean).join(", ")||"none"}
Forms: ${forms?.length?forms.length+" form(s)":"none"}
Content: ${paragraphs?.slice(0,2).join(" ").slice(0,500)||"none"}`.trim();

    const prompt = `Analyze this webpage and explain it simply. Respond in ${language==="en"?"English":language}.
${context}
Return ONLY valid JSON (no markdown, no code fences):
{"summary":"2-3 plain sentence description (max 60 words)","keyActions":["action 1","action 2"],"alerts":[],"difficulty":"easy"}
difficulty: easy/medium/hard. keyActions: 2-5 things. alerts: empty unless login/paywall.`;

    const parsed = await callGroqJSON(prompt);
    return {
      summary: parsed.summary || "This page could not be analyzed.",
      keyActions: Array.isArray(parsed.keyActions) ? parsed.keyActions : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
      difficulty: parsed.difficulty || "medium",
    };
  } catch (err) {
    if (err.message === "NO_API_KEY") {
      return {
        summary: "Please add your Groq API key in Settings to use AI features.",
        keyActions: ["Go to Settings tab, paste your Groq API key, click Test Key, then Save"],
        alerts: ["Get a free key at console.groq.com — no credit card needed"],
        difficulty: "easy",
        noApiKey: true,
      };
    }
    console.error("[UIA] explainPage error:", err.message);
    return {
      summary: "Could not analyze this page. Error: " + err.message,
      keyActions: [],
      alerts: ["Check your API key in Settings"],
      difficulty: "medium",
    };
  }
}

// ─── Simplify Text ────────────────────────────────────────────────────────
async function simplifyText({ texts, language }) {
  if (!texts?.length) return { simplified: [] };
  try {
    const prompt = `Rewrite each text in simple language (grade 5 level). Short sentences. Common words. Same meaning.
Return ONLY valid JSON (no markdown):
{"simplified":["simple text 1","simple text 2"]}
Texts:
${texts.slice(0,10).map((t,i)=>`${i+1}. ${t}`).join("\n")}`;
    const parsed = await callGroqJSON(prompt);
    return { simplified: parsed.simplified || texts };
  } catch (err) {
    return { simplified: texts };
  }
}

// ─── Translate Text ───────────────────────────────────────────────────────
async function translateText({ texts, targetLanguage }) {
  if (!texts?.length) return { translated: [] };
  const langNames = {
    es:"Spanish", fr:"French", de:"German", hi:"Hindi",
    ar:"Arabic", zh:"Chinese", pt:"Portuguese", ja:"Japanese",
    ko:"Korean", it:"Italian", ru:"Russian", ta:"Tamil",
    te:"Telugu", bn:"Bengali", mr:"Marathi",
  };
  const lang = langNames[targetLanguage] || targetLanguage;
  try {
    const prompt = `Translate to ${lang}. Keep tone and meaning. Be concise for UI labels.
Return ONLY valid JSON (no markdown):
{"translated":["translation 1","translation 2"]}
Texts:
${texts.slice(0,20).map((t,i)=>`${i+1}. ${t}`).join("\n")}`;
    const parsed = await callGroqJSON(prompt);
    return { translated: parsed.translated || texts };
  } catch (err) {
    return { translated: texts };
  }
}

// ─── Voice Command ────────────────────────────────────────────────────────
async function interpretVoiceCommand({ command, pageData }) {
  try {
    const buttons = pageData?.buttons?.slice(0,8).map(b=>b.text).filter(Boolean).join(", ")||"none";
    const links   = pageData?.links?.slice(0,8).map(l=>l.text).filter(Boolean).join(", ")||"none";
    const prompt = `Voice command: "${command}"
Buttons: ${buttons}
Links: ${links}
Map to action. Return ONLY valid JSON (no markdown):
{"action":{"type":"click","selector":"button","description":"what was done"}}
type: click/scroll_to/fill_field/navigate/none`;
    const parsed = await callGroqJSON(prompt);
    return { action: parsed.action || null };
  } catch (err) {
    return { action: null };
  }
}

// ─── Preferences ─────────────────────────────────────────────────────────
async function savePreferences({ preferences }) {
  await chrome.storage.sync.set({ uia_prefs: preferences });
  // Support both old geminiApiKey field and new groqApiKey field
  const key = preferences.groqApiKey || preferences.geminiApiKey;
  if (key) {
    await chrome.storage.sync.set({ uia_groq_key: key });
  }
  return { ok: true };
}

async function getPreferences() {
  const stored = await chrome.storage.sync.get(["uia_prefs", "uia_groq_key"]);
  return {
    preferences: stored.uia_prefs || {},
    hasApiKey: !!stored.uia_groq_key,
  };
}
