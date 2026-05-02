/**
 * App.jsx — Main Overlay Panel (Fixed)
 * Key fixes:
 * - Handles TAB_SWITCH message to auto-navigate to Explain tab
 * - Handles NOTIFICATION message for toast alerts
 * - Properly passes sendMessage to all tabs
 * - Loads API key state on mount
 */

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBridge } from "../hooks/useBridge";
import DashboardTab from "../components/DashboardTab";
import ModesTab from "../components/ModesTab";
import VoiceTab from "../components/VoiceTab";
import ExplainTab from "../components/ExplainTab";
import SettingsTab from "../components/SettingsTab";
import Header from "../components/Header";
import TabBar from "../components/TabBar";

const TABS = [
  { id: "dashboard", label: "Home",     icon: "⊙" },
  { id: "modes",     label: "Modes",    icon: "◈" },
  { id: "voice",     label: "Voice",    icon: "◎" },
  { id: "explain",   label: "Explain",  icon: "◇" },
  { id: "settings",  label: "Settings", icon: "◫" },
];

export default function App() {
  const [activeTab,      setActiveTab]      = useState("dashboard");
  const [isEnabled,      setIsEnabled]      = useState(false);
  const [modes,          setModes]          = useState({
    lowVision: false, colorBlind: false, simpleMode: false,
    translateMode: false, voiceMode: false,
  });
  const [pageData,       setPageData]       = useState(null);
  const [explanation,    setExplanation]    = useState(null);
  const [isExplaining,   setIsExplaining]   = useState(false);
  const [voiceActive,    setVoiceActive]    = useState(false);
  const [voiceTranscript,setVoiceTranscript]= useState("");
  const [preferences,    setPreferences]    = useState({
    language: "en", speechRate: 0.9, fontSize: "normal", groqApiKey: "",
  });
  const [notification,   setNotification]   = useState(null);
  const [hasApiKey,      setHasApiKey]      = useState(false);

  // ── Bridge ───────────────────────────────────────────────────────────────
  const { sendMessage } = useBridge((message) => {
    switch (message.type) {

      case "INIT_STATE":
        setIsEnabled(message.payload.isEnabled || false);
        if (message.payload.modes) setModes(message.payload.modes);
        if (message.payload.preferences) setPreferences((p) => ({ ...p, ...message.payload.preferences }));
        break;

      case "STATE_UPDATE":
        if (message.payload.isEnabled !== undefined) setIsEnabled(message.payload.isEnabled);
        break;

      case "PAGE_DATA":
        setPageData(message.payload);
        break;

      case "EXPLAINING_PAGE":
        setIsExplaining(true);
        setExplanation(null);
        break;

      case "PAGE_EXPLANATION":
        setIsExplaining(false);
        setExplanation(message.payload);
        // If no API key, switch to settings
        if (message.payload?.noApiKey) {
          setTimeout(() => setActiveTab("settings"), 1500);
        }
        break;

      case "VOICE_STATUS":
        setVoiceActive(message.payload.active);
        if (!message.payload.active) setVoiceTranscript("");
        break;

      case "VOICE_TRANSCRIPT":
        setVoiceTranscript(message.payload.text);
        break;

      case "VOICE_ERROR":
        showNotification("Voice: " + message.payload.error, "error");
        setVoiceActive(false);
        break;

      case "VOICE_COMMAND":
        if (message.payload.command === "open_settings") setActiveTab("settings");
        break;

      case "TAB_SWITCH":
        if (message.payload.tab) setActiveTab(message.payload.tab);
        break;

      case "NOTIFICATION":
        showNotification(message.payload.text, message.payload.type || "info");
        break;
    }
  });

  // ── Load API key state on mount ──────────────────────────────────────────
  useEffect(() => {
    // Ask background if API key is set
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "GET_PREFERENCES" }, (resp) => {
        if (chrome.runtime.lastError) return;
        setHasApiKey(!!resp?.hasApiKey);
        if (resp?.preferences?.groqApiKey !== undefined) {
          setPreferences((p) => ({ ...p, ...resp.preferences }));
        }
      });
    }
    // Scan page after mount
    setTimeout(() => sendMessage("SCAN_PAGE"), 800);
  }, []);

  function showNotification(text, type = "info") {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  }

  const toggleExtension = useCallback(() => {
    const next = !isEnabled;
    setIsEnabled(next);
    sendMessage("TOGGLE_EXTENSION", { enabled: next });
  }, [isEnabled, sendMessage]);

  const toggleMode = useCallback((mode) => {
    const next = !modes[mode];
    setModes((prev) => ({ ...prev, [mode]: next }));
    sendMessage("SET_MODE", { mode, value: next });
    if (mode === "voiceMode") setVoiceActive(next);
  }, [modes, sendMessage]);

  const explainPage = useCallback(() => {
    setActiveTab("explain");
    setIsExplaining(true);
    setExplanation(null);
    sendMessage("EXPLAIN_PAGE");
  }, [sendMessage]);

  const toggleVoice = useCallback(() => {
    if (voiceActive) {
      sendMessage("STOP_VOICE");
      setVoiceActive(false);
    } else {
      sendMessage("START_VOICE");
      setVoiceActive(true);
    }
  }, [voiceActive, sendMessage]);

  const savePreferences = useCallback((newPrefs) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    sendMessage("SAVE_PREFS", { preferences: updated });
    if (newPrefs.groqApiKey) setHasApiKey(!!newPrefs.groqApiKey);
    showNotification("Preferences saved ✓", "success");
  }, [preferences, sendMessage]);

  const tabProps = {
    isEnabled, modes, pageData, explanation, isExplaining,
    voiceActive, voiceTranscript, preferences, hasApiKey,
    toggleExtension, toggleMode, explainPage, toggleVoice,
    savePreferences, sendMessage, showNotification, setActiveTab,
  };

  const notifColors = {
    error:   { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)",   text: "#fca5a5" },
    success: { bg: "rgba(34,197,94,0.15)",   border: "rgba(34,197,94,0.3)",   text: "#86efac" },
    warning: { bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)",  text: "#fcd34d" },
    info:    { bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.3)",  text: "#a5b4fc" },
  };
  const nc = notifColors[notification?.type] || notifColors.info;

  return (
    <motion.div
      style={{
        width: "100%", height: "100%", borderRadius: 18,
        display: "flex", flexDirection: "column", overflow: "hidden",
        position: "relative",
        background: "rgba(8,11,20,0.96)",
        backdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 180,
        background: "radial-gradient(ellipse at top, rgba(99,102,241,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <Header isEnabled={isEnabled} toggleExtension={toggleExtension} sendMessage={sendMessage} />

      {/* Toast notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: "absolute", top: 56, left: 10, right: 10, zIndex: 100,
              background: nc.bg, border: `1px solid ${nc.border}`,
              borderRadius: 9, padding: "7px 12px",
              fontSize: 11, color: nc.text, lineHeight: 1.4,
            }}
          >
            {notification.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No API key warning banner */}
      {!hasApiKey && activeTab !== "settings" && (
        <div
          onClick={() => setActiveTab("settings")}
          style={{
            margin: "6px 10px 0", padding: "7px 12px",
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 8, fontSize: 11, color: "#fcd34d",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          ⚠️ Add your Groq API key in Settings to enable AI features →
        </div>
      )}

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}
          >
            {activeTab === "dashboard" && <DashboardTab {...tabProps} />}
            {activeTab === "modes"     && <ModesTab     {...tabProps} />}
            {activeTab === "voice"     && <VoiceTab     {...tabProps} />}
            {activeTab === "explain"   && <ExplainTab   {...tabProps} />}
            {activeTab === "settings"  && <SettingsTab  {...tabProps} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <TabBar tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
    </motion.div>
  );
}
