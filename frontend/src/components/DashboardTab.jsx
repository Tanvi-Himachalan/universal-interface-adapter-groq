/**
 * DashboardTab.jsx — Home/Dashboard screen
 * Shows quick overview, active modes, and quick actions
 */

import React from "react";
import { motion } from "framer-motion";

const QuickAction = ({ icon, label, desc, onClick, color = "#6366f1", delay = 0 }) => (
  <motion.button
    onClick={onClick}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "#0d1120",
      cursor: "pointer",
      textAlign: "left",
      width: "100%",
      outline: "none",
      marginBottom: 6,
      transition: "all 0.2s",
    }}
    whileHover={{ background: "#111827", borderColor: `${color}44`, x: 2 }}
    whileTap={{ scale: 0.98 }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#e8eaf2", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 10, color: "#4b5280" }}>{desc}</div>
    </div>
    <div style={{ marginLeft: "auto", color: "#4b5280", fontSize: 12 }}>›</div>
  </motion.button>
);

const StatCard = ({ value, label, color, icon }) => (
  <div
    style={{
      background: "#0d1120",
      borderRadius: 12,
      padding: "12px 10px",
      border: "1px solid rgba(255,255,255,0.06)",
      textAlign: "center",
      flex: 1,
    }}
  >
    <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'Syne', sans-serif" }}>{value}</div>
    <div style={{ fontSize: 9, color: "#4b5280", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
  </div>
);

export default function DashboardTab({ isEnabled, modes, pageData, explainPage, toggleVoice, voiceActive, toggleExtension }) {
  const activeCount = Object.values(modes).filter(Boolean).length;

  const modeLabels = {
    lowVision: { label: "Low Vision", icon: "👁️", color: "#6366f1" },
    colorBlind: { label: "Color Blind", icon: "🎨", color: "#8b5cf6" },
    simpleMode: { label: "Simple Mode", icon: "📝", color: "#22d3ee" },
    translateMode: { label: "Translate", icon: "🌐", color: "#f59e0b" },
    voiceMode: { label: "Voice", icon: "🎤", color: "#22c55e" },
  };

  return (
    <div style={{ padding: "14px 14px 8px" }}>
      {/* Status banner */}
      {!isEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>💡</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#a5b4fc" }}>Extension disabled</div>
            <div style={{ fontSize: 10, color: "#4b5280" }}>Toggle the switch to enable accessibility features</div>
          </div>
          <motion.button
            onClick={toggleExtension}
            style={{
              marginLeft: "auto",
              padding: "4px 10px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
              flexShrink: 0,
            }}
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.95 }}
          >
            Enable
          </motion.button>
        </motion.div>
      )}

      {/* Stats row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <StatCard
          value={activeCount}
          label="Active Modes"
          color="#a5b4fc"
          icon="⚙️"
        />
        <StatCard
          value={pageData?.buttons?.length || 0}
          label="Buttons"
          color="#86efac"
          icon="🔘"
        />
        <StatCard
          value={pageData?.images?.length || 0}
          label="Images"
          color="#fcd34d"
          icon="🖼️"
        />
      </div>

      {/* Active modes pills */}
      {activeCount > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "#4b5280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Active Modes
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(modes)
              .filter(([, v]) => v)
              .map(([key]) => (
                <motion.div
                  key={key}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 8px",
                    borderRadius: 20,
                    background: `${modeLabels[key]?.color || "#6366f1"}15`,
                    border: `1px solid ${modeLabels[key]?.color || "#6366f1"}30`,
                    fontSize: 10,
                    fontWeight: 600,
                    color: modeLabels[key]?.color || "#a5b4fc",
                  }}
                >
                  {modeLabels[key]?.icon} {modeLabels[key]?.label}
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ fontSize: 9, color: "#4b5280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        Quick Actions
      </div>

      <QuickAction
        icon="🤖"
        label="Explain This Page"
        desc="AI analyzes the page and tells you what it does"
        onClick={explainPage}
        color="#6366f1"
        delay={0.05}
      />
      <QuickAction
        icon={voiceActive ? "🔴" : "🎤"}
        label={voiceActive ? "Stop Voice Commands" : "Start Voice Commands"}
        desc='Say "explain this page" or "click submit"'
        onClick={toggleVoice}
        color="#22c55e"
        delay={0.1}
      />
      <QuickAction
        icon="📖"
        label="Read Page Aloud"
        desc="Text-to-speech for the main content"
        onClick={() => window.parent.postMessage({ source: "UIA_OVERLAY", type: "SPEAK_TEXT", payload: { text: "reading" } }, "*")}
        color="#22d3ee"
        delay={0.15}
      />

      {/* Page info */}
      {pageData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            marginTop: 8,
            padding: "10px 12px",
            background: "#0d1120",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: 10, color: "#4b5280", marginBottom: 4 }}>Current Page</div>
          <div
            style={{
              fontSize: 11,
              color: "#7c82a8",
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {pageData.title || "Untitled page"}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#4b5280",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: 2,
            }}
          >
            {pageData.headings?.[0]?.text && `"${pageData.headings[0].text.slice(0, 60)}"`}
          </div>
        </motion.div>
      )}
    </div>
  );
}
