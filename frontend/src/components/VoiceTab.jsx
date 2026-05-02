/**
 * VoiceTab.jsx — Voice command interface
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const COMMANDS = [
  { cmd: "Explain this page", desc: "AI analyzes and explains the current page" },
  { cmd: "Read page", desc: "Reads the main content aloud" },
  { cmd: "Click submit", desc: "Clicks the submit button" },
  { cmd: "Open settings", desc: "Opens the settings tab" },
  { cmd: "Scroll down / up", desc: "Scrolls the page" },
  { cmd: "Go back", desc: "Navigates to previous page" },
  { cmd: "Increase font", desc: "Enables low vision mode" },
  { cmd: "Stop reading", desc: "Stops text-to-speech" },
  { cmd: "Turn off", desc: "Disables the extension" },
];

function WaveAnimation() {
  return (
    <div className="voice-wave" style={{ display: "flex", alignItems: "center", gap: 2, height: 24 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.span
          key={i}
          style={{
            display: "inline-block",
            width: 3,
            background: "linear-gradient(to top, #6366f1, #22d3ee)",
            borderRadius: 3,
          }}
          animate={{ scaleY: [0.4, 1.8, 0.4], height: [6, 20, 6] }}
          transition={{ duration: 1.2, delay: i * 0.1, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function VoiceTab({ voiceActive, voiceTranscript, toggleVoice, sendMessage }) {
  return (
    <div style={{ padding: "14px 14px 8px" }}>
      {/* Main voice button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, marginBottom: 20 }}>
        <motion.button
          onClick={toggleVoice}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "none",
            background: voiceActive
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            boxShadow: voiceActive
              ? "0 0 40px rgba(34,197,94,0.4), 0 8px 24px rgba(34,197,94,0.3)"
              : "0 8px 32px rgba(99,102,241,0.4)",
            outline: "none",
            position: "relative",
            marginBottom: 12,
          }}
          animate={voiceActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          aria-label={voiceActive ? "Stop voice recognition" : "Start voice recognition"}
        >
          {voiceActive && (
            <motion.div
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: "50%",
                border: "2px solid rgba(34,197,94,0.4)",
              }}
              animate={{ scale: [1, 1.2], opacity: [0.8, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          🎤
        </motion.button>

        {voiceActive ? <WaveAnimation /> : <div style={{ height: 24 }} />}

        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: voiceActive ? "#86efac" : "#a5a9c5",
            marginTop: 8,
          }}
        >
          {voiceActive ? "Listening..." : "Tap to start"}
        </div>
      </div>

      {/* Transcript */}
      <AnimatePresence>
        {(voiceTranscript || voiceActive) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "#0d1120",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 14,
              border: "1px solid rgba(255,255,255,0.06)",
              minHeight: 44,
            }}
          >
            <div style={{ fontSize: 9, color: "#4b5280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Transcript
            </div>
            <div style={{ fontSize: 13, color: voiceTranscript ? "#e8eaf2" : "#4b5280", fontStyle: voiceTranscript ? "normal" : "italic" }}>
              {voiceTranscript || "Say a command..."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick read actions */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <motion.button
          onClick={() =>
            window.parent.postMessage(
              { source: "UIA_OVERLAY", type: "SPEAK_TEXT", payload: { text: "read_page" } },
              "*"
            )
          }
          style={{
            flex: 1,
            padding: "9px 8px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "#0d1120",
            color: "#a5a9c5",
            fontSize: 11,
            cursor: "pointer",
            outline: "none",
            fontFamily: "'DM Sans', sans-serif",
          }}
          whileHover={{ background: "#111827" }}
          whileTap={{ scale: 0.96 }}
        >
          🔊 Read Page
        </motion.button>
        <motion.button
          onClick={() => window.speechSynthesis?.cancel()}
          style={{
            flex: 1,
            padding: "9px 8px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "#0d1120",
            color: "#a5a9c5",
            fontSize: 11,
            cursor: "pointer",
            outline: "none",
            fontFamily: "'DM Sans', sans-serif",
          }}
          whileHover={{ background: "#111827" }}
          whileTap={{ scale: 0.96 }}
        >
          ⏹ Stop
        </motion.button>
      </div>

      {/* Commands reference */}
      <div>
        <div
          style={{
            fontSize: 9,
            color: "#4b5280",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          Available Commands
        </div>

        {COMMANDS.map((item, i) => (
          <motion.div
            key={item.cmd}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: "flex",
              gap: 10,
              padding: "7px 0",
              borderBottom: i < COMMANDS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 6,
                padding: "2px 6px",
                fontSize: 10,
                color: "#a5b4fc",
                fontWeight: 600,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              "{item.cmd}"
            </div>
            <div style={{ fontSize: 10, color: "#4b5280", paddingTop: 2 }}>{item.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
