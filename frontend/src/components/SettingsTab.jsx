/**
 * SettingsTab.jsx — Fixed: includes Groq API key field
 * This is the most important fix — without the key, AI features don't work.
 */

import React, { useState } from "react";
import { motion } from "framer-motion";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
  { code: "it", label: "Italiano" },
];

function Row({ label, hint, children }) {
  return (
    <div style={{
      padding: "10px 12px",
      background: "#0d1120",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.06)",
      marginBottom: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: hint ? 4 : 0 }}>
        <div style={{ fontSize: 12, color: "#a5a9c5", fontWeight: 500 }}>{label}</div>
        {children}
      </div>
      {hint && <div style={{ fontSize: 10, color: "#4b5280", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export default function SettingsTab({ preferences, savePreferences, hasApiKey, showNotification }) {
  const [local, setLocal]       = useState({ ...preferences });
  const [saving, setSaving]     = useState(false);
  const [showKey, setShowKey]   = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState(null); // "ok" | "fail" | null

  function update(key, value) {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  async function testApiKey() {
    const key = local.groqApiKey?.trim();
    if (!key) { showNotification("Paste your Groq API key first", "warning"); return; }
    setTestingKey(true);
    setKeyStatus(null);

    try {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
        }),
      });
      setTestingKey(false);
      if (resp.ok) {
        setKeyStatus("ok");
        showNotification("API key works! ✓", "success");
      } else {
        const e = await resp.json().catch(() => ({}));
        setKeyStatus("fail");
        showNotification("Key failed: " + (e?.error?.message || "HTTP " + resp.status), "error");
      }
    } catch (e) {
      setTestingKey(false);
      setKeyStatus("fail");
      showNotification("Key failed: " + e.message, "error");
    }
  }

  async function handleSave() {
    setSaving(true);
    savePreferences(local);
    setTimeout(() => setSaving(false), 1200);
  }

  const speechLabel = local.speechRate < 0.7 ? "Very Slow"
    : local.speechRate < 0.9 ? "Slow"
    : local.speechRate < 1.1 ? "Normal"
    : local.speechRate < 1.4 ? "Fast" : "Very Fast";

  return (
    <div style={{ padding: "14px 14px 10px" }}>

      {/* ── Groq API Key (most important) ─────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 9, color: "#4b5280", textTransform: "uppercase",
          letterSpacing: "0.08em", marginBottom: 8,
        }}>
          AI Engine (Required)
        </div>

        {/* Key status banner */}
        {hasApiKey && keyStatus !== "fail" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8,
            fontSize: 11, color: "#86efac", marginBottom: 8,
          }}>
            ✓ Groq API key is saved and active
          </div>
        )}

        {!hasApiKey && (
          <div style={{
            padding: "10px 12px", background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10,
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fcd34d", marginBottom: 4 }}>
              ⚠️ API key required for AI features
            </div>
            <div style={{ fontSize: 11, color: "#a08020", lineHeight: 1.6 }}>
              Get a <strong style={{ color: "#fcd34d" }}>free</strong> key at{" "}
              <span style={{ color: "#93c5fd", textDecoration: "underline" }}>
                console.groq.com
              </span>
              <br />No credit card needed. Takes 30 seconds.
            </div>
          </div>
        )}

        <div style={{
          padding: "10px 12px", background: "#0d1120",
          border: `1px solid ${keyStatus === "ok" ? "rgba(34,197,94,0.4)" : keyStatus === "fail" ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 11, color: "#a5a9c5", fontWeight: 500, marginBottom: 6 }}>
            Groq API Key
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input
              type={showKey ? "text" : "password"}
              value={local.groqApiKey || ""}
              onChange={(e) => update("groqApiKey", e.target.value)}
              placeholder="gsk_..."
              style={{
                flex: 1,
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "7px 10px",
                color: "#e8eaf2", fontSize: 11,
                outline: "none", fontFamily: "var(--font-mono, monospace)",
                letterSpacing: local.groqApiKey && !showKey ? "0.15em" : "normal",
              }}
            />
            <motion.button
              onClick={() => setShowKey(!showKey)}
              style={{
                padding: "7px 10px", background: "#111827",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, color: "#4b5280", fontSize: 11,
                cursor: "pointer", outline: "none", flexShrink: 0,
                fontFamily: "'DM Sans', sans-serif",
              }}
              whileHover={{ color: "#a5a9c5" }}
            >
              {showKey ? "Hide" : "Show"}
            </motion.button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <motion.button
              onClick={testApiKey}
              disabled={testingKey}
              style={{
                flex: 1, padding: "7px",
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 8, color: "#a5b4fc", fontSize: 11,
                fontWeight: 600, cursor: "pointer", outline: "none",
                fontFamily: "'DM Sans', sans-serif",
              }}
              whileHover={{ background: "rgba(99,102,241,0.18)" }}
              whileTap={{ scale: 0.97 }}
            >
              {testingKey ? "Testing…" : "Test Key"}
            </motion.button>
            <div style={{ fontSize: 10, color: "#4b5280", flex: 2, paddingTop: 8, paddingLeft: 4 }}>
              Click Test to verify before saving
            </div>
          </div>
        </div>
      </div>

      {/* ── Language ───────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 9, color: "#4b5280", textTransform: "uppercase",
          letterSpacing: "0.08em", marginBottom: 8,
        }}>
          Language (used for Translate + Voice)
        </div>
        <div style={{
          padding: "10px 12px", background: "#0d1120",
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {LANGUAGES.map((lang) => (
              <motion.button
                key={lang.code}
                onClick={() => update("language", lang.code)}
                style={{
                  padding: "4px 10px", borderRadius: 8, fontSize: 11,
                  cursor: "pointer", outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  border: local.language === lang.code
                    ? "1px solid rgba(99,102,241,0.5)"
                    : "1px solid rgba(255,255,255,0.06)",
                  background: local.language === lang.code
                    ? "rgba(99,102,241,0.15)" : "#111827",
                  color: local.language === lang.code ? "#a5b4fc" : "#4b5280",
                  fontWeight: local.language === lang.code ? 600 : 400,
                  transition: "all 0.15s",
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {lang.label}
              </motion.button>
            ))}
          </div>
          {local.language !== "en" && (
            <div style={{ fontSize: 10, color: "#4b5280", marginTop: 8 }}>
              ✓ Translate mode will translate the page to {LANGUAGES.find(l => l.code === local.language)?.label}
            </div>
          )}
        </div>
      </div>

      {/* ── Speech Rate ────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 9, color: "#4b5280", textTransform: "uppercase",
          letterSpacing: "0.08em", marginBottom: 8,
        }}>
          Voice Speed
        </div>
        <div style={{
          padding: "10px 12px", background: "#0d1120",
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#a5a9c5" }}>Speech Rate</div>
            <div style={{
              fontSize: 11, color: "#6366f1",
              background: "rgba(99,102,241,0.1)",
              padding: "2px 8px", borderRadius: 6,
            }}>
              {speechLabel}
            </div>
          </div>
          <input
            type="range" min="0.5" max="2" step="0.1"
            value={local.speechRate || 0.9}
            onChange={(e) => update("speechRate", parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#4b5280", marginTop: 3 }}>
            <span>0.5× Slow</span><span>1× Normal</span><span>2× Fast</span>
          </div>
        </div>
      </div>

      {/* ── Save / Reset ───────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8 }}>
        <motion.button
          onClick={handleSave}
          style={{
            flex: 2, padding: "11px",
            borderRadius: 12, border: "none",
            background: saving
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", fontSize: 12, fontWeight: 600,
            cursor: "pointer", outline: "none",
            fontFamily: "'DM Sans', sans-serif",
            transition: "background 0.4s",
          }}
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.97 }}
        >
          {saving ? "✓ Saved!" : "Save Preferences"}
        </motion.button>
        <motion.button
          onClick={() => {
            const def = { language: "en", speechRate: 0.9, groqApiKey: local.groqApiKey };
            setLocal(def);
            savePreferences(def);
          }}
          style={{
            flex: 1, padding: "11px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "#0d1120", color: "#4b5280",
            fontSize: 12, fontWeight: 500,
            cursor: "pointer", outline: "none",
            fontFamily: "'DM Sans', sans-serif",
          }}
          whileHover={{ color: "#a5a9c5" }}
          whileTap={{ scale: 0.97 }}
        >
          Reset
        </motion.button>
      </div>

      {/* About */}
      <div style={{
        marginTop: 12, padding: "9px 12px",
        background: "#0d1120", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.06)",
        fontSize: 10, color: "#4b5280", lineHeight: 1.7,
      }}>
        <strong style={{ color: "#7c82a8" }}>Universal Interface Adapter</strong> v1.0.0<br />
        AI Accessibility Layer · Powered by Groq (free)<br />
        Firebase · React · Framer Motion · Web Speech API
      </div>
    </div>
  );
}
