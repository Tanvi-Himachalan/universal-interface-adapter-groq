/**
 * ExplainTab.jsx — AI Page Explanation
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

function LoadingPulse() {
  return (
    <div style={{ padding: "20px 14px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 20 }}>
        <motion.div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🤖
        </motion.div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#a5b4fc", marginBottom: 6 }}>
            Analyzing page...
          </div>
          <div style={{ fontSize: 11, color: "#4b5280" }}>AI is reading the content and structure</div>
        </div>

        {/* Skeleton lines */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          {[100, 80, 90, 60].map((w, i) => (
            <motion.div
              key={i}
              style={{
                height: 10,
                borderRadius: 6,
                background: "#1e2440",
                width: `${w}%`,
              }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DifficultyBadge({ level }) {
  const config = {
    easy: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Easy to read" },
    medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Moderate" },
    hard: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Complex" },
  };
  const c = config[level] || config.medium;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 20,
        background: c.bg,
        color: c.color,
        fontSize: 10,
        fontWeight: 600,
        border: `1px solid ${c.color}30`,
      }}
    >
      ● {c.label}
    </span>
  );
}

export default function ExplainTab({ explanation, isExplaining, explainPage, pageData, sendMessage }) {
  if (isExplaining) return <LoadingPulse />;

  if (!explanation) {
    return (
      <div style={{ padding: "14px 14px" }}>
        <div style={{ textAlign: "center", paddingTop: 30, paddingBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 15,
              fontWeight: 800,
              color: "#e8eaf2",
              marginBottom: 8,
            }}
          >
            Page Explainer
          </div>
          <div style={{ fontSize: 12, color: "#4b5280", lineHeight: 1.6, marginBottom: 20 }}>
            Our AI will analyze this page and tell you what it does, what actions you can take, and any important alerts.
          </div>

          <motion.button
            onClick={explainPage}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
            }}
            whileHover={{ scale: 1.02, opacity: 0.95 }}
            whileTap={{ scale: 0.97 }}
          >
            🤖 Explain This Page
          </motion.button>
        </div>

        {/* Page stats */}
        {pageData && (
          <div
            style={{
              background: "#0d1120",
              borderRadius: 12,
              padding: "12px 14px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 9, color: "#4b5280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Page Structure
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Headings", value: pageData.headings?.length || 0, icon: "H" },
                { label: "Buttons", value: pageData.buttons?.length || 0, icon: "B" },
                { label: "Links", value: pageData.links?.length || 0, icon: "L" },
                { label: "Forms", value: pageData.forms?.length || 0, icon: "F" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "#111827",
                    borderRadius: 8,
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: "rgba(99,102,241,0.12)",
                      color: "#a5b4fc",
                      fontSize: 9,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf2" }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: "#4b5280" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show explanation
  return (
    <div style={{ padding: "14px 14px 8px" }}>
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 14,
          padding: "14px",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            🤖
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc" }}>AI Summary</div>
          {explanation.difficulty && <DifficultyBadge level={explanation.difficulty} />}
        </div>
        <div style={{ fontSize: 12, color: "#c7d2fe", lineHeight: 1.7 }}>
          {explanation.summary || "No summary available"}
        </div>
      </motion.div>

      {/* Key Actions */}
      {explanation.keyActions?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 12 }}
        >
          <div style={{ fontSize: 9, color: "#4b5280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Key Actions You Can Take
          </div>
          {explanation.keyActions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              style={{
                display: "flex",
                gap: 10,
                padding: "8px 10px",
                background: "#0d1120",
                borderRadius: 10,
                marginBottom: 6,
                border: "1px solid rgba(255,255,255,0.06)",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: "rgba(34,197,94,0.12)",
                  color: "#22c55e",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 11, color: "#a5a9c5", lineHeight: 1.5 }}>{action}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Alerts */}
      {explanation.alerts?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: 12 }}
        >
          <div style={{ fontSize: 9, color: "#4b5280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Important Alerts
          </div>
          {explanation.alerts.map((alert, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                padding: "8px 10px",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 10,
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
              <div style={{ fontSize: 11, color: "#fcd34d", lineHeight: 1.5 }}>{alert}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Re-analyze button */}
      <motion.button
        onClick={explainPage}
        style={{
          width: "100%",
          padding: "9px",
          borderRadius: 10,
          border: "1px solid rgba(99,102,241,0.3)",
          background: "rgba(99,102,241,0.08)",
          color: "#a5b4fc",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          outline: "none",
          fontFamily: "'DM Sans', sans-serif",
        }}
        whileHover={{ background: "rgba(99,102,241,0.12)" }}
        whileTap={{ scale: 0.98 }}
      >
        🔄 Re-analyze Page
      </motion.button>
    </div>
  );
}
