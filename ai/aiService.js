/**
 * aiService.js — Groq API integration (FREE tier)
 *
 * Using Groq instead of Gemini because:
 *  - Completely FREE (no credit card needed)
 *  - 14,400 requests/day on llama-3.1-8b-instant
 *  - Much faster than Gemini (500+ tokens/second)
 *  - OpenAI-compatible API format
 *
 * Get your free API key at: https://console.groq.com
 * Set it in backend/.env as: GROQ_API_KEY=gsk_...
 */

const MODEL_NAME = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set in .env");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

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

async function simplifyTexts(texts, language = "en") {
  if (!texts || texts.length === 0) return { simplified: [] };
  const prompt = `Rewrite each text in simple, clear language (grade 5 reading level). Short sentences. Common words. Same meaning.
Return ONLY valid JSON (no markdown, no code fences):
{"simplified": ["simplified text 1", "simplified text 2"]}
Texts:
${texts.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
  try {
    const parsed = await callGroqJSON(prompt);
    return { simplified: parsed.simplified || texts };
  } catch (err) {
    console.error("Simplify error:", err.message);
    return { simplified: texts };
  }
}

async function translateTexts(texts, targetLanguage) {
  if (!texts || texts.length === 0) return { translated: [] };
  const languageNames = {
    es:"Spanish", fr:"French", de:"German", hi:"Hindi",
    ar:"Arabic", zh:"Chinese (Simplified)", pt:"Portuguese",
    ja:"Japanese", ko:"Korean", it:"Italian", ru:"Russian",
    ta:"Tamil", te:"Telugu", bn:"Bengali", mr:"Marathi",
  };
  const langName = languageNames[targetLanguage] || targetLanguage;
  const prompt = `Translate these texts to ${langName}. Keep tone and meaning. Be concise for UI labels.
Return ONLY valid JSON (no markdown):
{"translated": ["translated 1", "translated 2"]}
Texts:
${texts.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
  try {
    const parsed = await callGroqJSON(prompt);
    return { translated: parsed.translated || texts };
  } catch (err) {
    console.error("Translate error:", err.message);
    return { translated: texts };
  }
}

async function explainPage(pageData, language = "en") {
  const { title, url, headings, buttons, links, forms, images, paragraphs } = pageData;
  const pageContext = `Page: ${title || "Unknown"} (${url || ""})
Headings: ${headings?.slice(0,5).map(h=>h.text).join(" | ")||"None"}
Buttons: ${buttons?.slice(0,8).map(b=>b.text).join(", ")||"None"}
Links: ${links?.slice(0,6).map(l=>l.text).join(", ")||"None"}
Forms: ${forms?.length>0?`${forms.length} form(s)`:"None"}
Content: ${paragraphs?.slice(0,2).join(" ").slice(0,400)||"None"}`.trim();

  const prompt = `Analyze this webpage and explain it simply. Respond in ${language==="en"?"English":language}.
${pageContext}
Return ONLY valid JSON (no markdown):
{"summary":"2-3 plain sentence description (max 60 words)","keyActions":["action 1","action 2"],"alerts":[],"difficulty":"easy"}
difficulty: easy/medium/hard. keyActions: 2-5 things user can do. alerts: empty unless login/paywall required.`;
  try {
    const parsed = await callGroqJSON(prompt);
    return {
      summary: parsed.summary || "Could not analyze this page.",
      keyActions: parsed.keyActions || [],
      alerts: parsed.alerts || [],
      difficulty: parsed.difficulty || "medium",
    };
  } catch (err) {
    console.error("Explain error:", err.message);
    return { error:"Could not analyze page", summary:"Unable to analyze right now.", keyActions:[], alerts:[], difficulty:"medium" };
  }
}

async function interpretVoiceCommand(command, pageData) {
  const { buttons, links, forms } = pageData;
  const prompt = `Voice command: "${command}"
Buttons: ${buttons?.slice(0,10).map(b=>b.text).join(", ")||"none"}
Links: ${links?.slice(0,10).map(l=>l.text).join(", ")||"none"}
Fields: ${forms?.flatMap(f=>f.fields.map(fi=>fi.label||fi.name)).slice(0,10).join(", ")||"none"}
Map to action. Return ONLY valid JSON (no markdown):
{"action":{"type":"click","selector":"button","value":null,"description":"what was done"}}
type: click/scroll_to/fill_field/navigate/none`;
  try {
    const parsed = await callGroqJSON(prompt);
    return { action: parsed.action || null };
  } catch (err) {
    console.error("Command error:", err.message);
    return { action: null };
  }
}

module.exports = { simplifyTexts, translateTexts, explainPage, interpretVoiceCommand };
