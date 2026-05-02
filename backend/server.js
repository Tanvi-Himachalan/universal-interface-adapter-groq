/**
 * server.js — Universal Interface Adapter Backend
 * Express API that proxies OpenAI securely and manages user data via Firebase.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

// ─── Logger ───────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// ─── App Setup ────────────────────────────────────────────────────────────
const app = express();

// Security headers
app.use(helmet());

// CORS — allow only our extension and dev server
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, Postman)
      if (!origin) return callback(null, true);

      // Allow chrome-extension:// origins
      if (origin.startsWith("chrome-extension://")) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      logger.warn(`Blocked CORS request from: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies
app.use(express.json({ limit: "1mb" }));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "30"),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});
app.use(globalLimiter);

// Stricter rate limit for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 15,
  message: { error: "AI rate limit reached. Please wait a minute." },
});

// ─── Routes ───────────────────────────────────────────────────────────────
const aiRoutes = require("./routes/ai");
const userRoutes = require("./routes/user");
const analyticsRoutes = require("./routes/analytics");

app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/user", userRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`🚀 UIA Backend running on http://localhost:${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`   Groq model: ${process.env.GROQ_MODEL || "GROQ_MODEL"}`);
});

module.exports = app;
