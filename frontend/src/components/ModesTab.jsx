/**
 * ModesTab.jsx — Accessibility mode controls
 */

import React from "react";
import { motion } from "framer-motion";

const modes = [
  {
    id: "lowVision",
    icon: "👁️",
    label: "Low Vision",
    desc: "High contrast colors, enlarged fonts, enhanced focus indicators",
    color: "#6366f1",
    features: ["120% font size", "Yellow on black", "Bold focus rings", "Brighter images"],
  },
  {
    id: "colorBlind",
    icon: "🎨",
    label: "Color Blind",
    desc: "Replaces color-coded information with patterns and shapes",
    color: "#8b5cf6",
    features: ["SVG color filter", "Hatch patterns", "Deuteranopia support", "Pattern overlays"],
  },
  {
    id: "simpleMode",
    icon: "📝",
    label: "Simple Mode",
    desc: "AI rewrites complex text in plain English, adds icon hints",
    color: "#22d3ee",
    features: ["AI text simplification", "Contextual icons", "Tooltip explanations", "Easy language"],
  },
  {
    id: "translateMode",
    icon: "🌐",
    label: "Translate",
    desc: "Translates the full page to your preferred language via AI",
    color: "#f59e0b",
    features: ["Full page translation", "AI-powered", "Preserves layout", "20+ languages"],
  },
  {
    id: "voiceMode",
    icon: "🎤",
    label: "Voice Commands",
    desc: "Control the page hands-free with natural language",
    color: "#22c55e",
    features: ["Speech-to-text", "Natural commands", "Page reading", "Form navigation"],
  },
];

function ModeCard({ mode, isActive, onToggle, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{
        borderRadius: 14,
        border: isActive ? `1px solid ${mode.color}44` : "1px solid rgba(255,255,255,0.06)",
        background: isActive ? `${mode.color}08` : "#0d1120",
        padding: "12px 14px",
        marginBottom: 8,
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
      onClick={() => onToggle(mode.id)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Active glow */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${mode.color}, transparent)`,
            borderRadius: "14px 14px 0 0",
          }}
        />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `${mode.color}15`,
            border: `1px solid ${mode.color}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {mode.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? "#e8eaf2" : "#a5a9c5" }}>{mode.label}</div>

            {/* Toggle */}
            <motion.div
              style={{
                position: "relative",
                width: 36,
                height: 20,
                borderRadius: 10,
                background: isActive ? mode.color : "#1e2440",
                cursor: "pointer",
                flexShrink: 0,
                border: `1px solid ${isActive ? mode.color : "rgba(255,255,255,0.08)"}`,
                transition: "background 0.3s",
              }}
            >
              <motion.div
                style={{
                  position: "absolute",
                  top: 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: isActive ? "#fff" : "#4b5280",
                }}
                animate={{ left: isActive ? 18 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.div>
          </div>

          <div style={{ fontSize: 10, color: "#4b5280", lineHeight: 1.5, marginBottom: isActive ? 8 : 0 }}>
            {mode.desc}
          </div>

          {/* Feature tags - shown when active */}
          <motion.div
            initial={false}
            animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingTop: 4 }}>
              {mode.features.map((f) => (
                <span
                  key={f}
                  style={{
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: `${mode.color}12`,
                    border: `1px solid ${mode.color}25`,
                    fontSize: 9,
                    color: mode.color,
                    fontWeight: 500,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ModesTab({ modes: activeModes, toggleMode, isEnabled }) {
  const activeCount = Object.values(activeModes).filter(Boolean).length;

  return (
    <div style={{ padding: "14px 14px 8px" }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 15,
            fontWeight: 800,
            color: "#e8eaf2",
            marginBottom: 3,
          }}
        >
          Accessibility Modes
        </div>
        <div style={{ fontSize: 11, color: "#4b5280" }}>
          {activeCount > 0 ? `${activeCount} mode${activeCount > 1 ? "s" : ""} active` : "All modes disabled — enable what you need"}
        </div>
      </div>

      {!isEnabled && (
        <div
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 11,
            color: "#fcd34d",
            marginBottom: 12,
          }}
        >
          ⚠️ Enable the extension first to use modes
        </div>
      )}

      {modes.map((mode, i) => (
        <ModeCard
          key={mode.id}
          mode={mode}
          isActive={activeModes[mode.id]}
          onToggle={toggleMode}
          delay={i * 0.06}
        />
      ))}
    </div>
  );
}
