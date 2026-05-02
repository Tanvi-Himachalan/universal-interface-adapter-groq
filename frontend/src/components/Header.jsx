/**
 * Header.jsx — Overlay Panel Header
 * Shows logo, enable toggle, and close button
 */

import React from "react";
import { motion } from "framer-motion";

export default function Header({ isEnabled, toggleExtension, sendMessage }) {
  const activeModeCount = 0; // Could count from parent if needed

  return (
    <div
      style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
        cursor: "move",
        userSelect: "none",
      }}
      className="drag-handle"
    >
      {/* Logo */}
      <motion.div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: isEnabled
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : "linear-gradient(135deg, #1e2440, #2d3356)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
          transition: "background 0.4s",
          boxShadow: isEnabled ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
        }}
        animate={isEnabled ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ♿
      </motion.div>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            fontWeight: 800,
            color: "#e8eaf2",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Interface Adapter
        </div>
        <div style={{ fontSize: 10, color: isEnabled ? "#6366f1" : "#4b5280", fontWeight: 500 }}>
          {isEnabled ? "● Active" : "○ Inactive"}
        </div>
      </div>

      {/* Toggle */}
      <motion.button
        onClick={toggleExtension}
        style={{
          position: "relative",
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          background: isEnabled ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#1e2440",
          cursor: "pointer",
          flexShrink: 0,
          outline: "none",
          transition: "background 0.3s",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isEnabled ? "Disable accessibility" : "Enable accessibility"}
      >
        <motion.div
          style={{
            position: "absolute",
            top: 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: isEnabled ? "#fff" : "#4b5280",
          }}
          animate={{ left: isEnabled ? 22 : 3 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>

      {/* Close */}
      <motion.button
        onClick={() => sendMessage("CLOSE_PANEL")}
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          border: "none",
          background: "rgba(255,255,255,0.04)",
          color: "#4b5280",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          flexShrink: 0,
          outline: "none",
        }}
        whileHover={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
        whileTap={{ scale: 0.9 }}
        aria-label="Close panel"
      >
        ✕
      </motion.button>
    </div>
  );
}
