/**
 * TabBar.jsx — Bottom navigation tabs
 */

import React from "react";
import { motion } from "framer-motion";

export default function TabBar({ tabs, activeTab, setActiveTab }) {
  return (
    <div
      style={{
        display: "flex",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 8px 10px",
        gap: 4,
        flexShrink: 0,
        background: "rgba(0,0,0,0.2)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 4px",
              border: "none",
              borderRadius: 10,
              background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
              cursor: "pointer",
              color: isActive ? "#a5b4fc" : "#4b5280",
              outline: "none",
              transition: "all 0.2s",
            }}
            whileHover={{ background: "rgba(99,102,241,0.08)", color: "#7c82a8" }}
            whileTap={{ scale: 0.92 }}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            <motion.span
              style={{ fontSize: 14 }}
              animate={isActive ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {tab.icon}
            </motion.span>
            <span
              style={{
                fontSize: 9,
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
