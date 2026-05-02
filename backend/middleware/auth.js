/**
 * middleware/auth.js
 * Firebase Admin SDK token verification middleware.
 * requireAuth — blocks unauthenticated requests
 * optionalAuth — attaches user if token present, continues if not
 */

const admin = require("./firebase").getAdmin();

/**
 * Verify Firebase ID token from Authorization header.
 * Returns decoded token payload or null.
 */
async function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split("Bearer ")[1];
  if (!token) return null;

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (err) {
    console.warn("Token verification failed:", err.code);
    return null;
  }
}

/**
 * Middleware: requires valid Firebase auth token.
 * Returns 401 if missing or invalid.
 */
async function requireAuth(req, res, next) {
  const user = await verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.user = user;
  next();
}

/**
 * Middleware: optionally attaches user from Firebase token.
 * Does not block if no token present.
 */
async function optionalAuth(req, res, next) {
  const user = await verifyToken(req);
  req.user = user; // may be null
  next();
}

module.exports = { requireAuth, optionalAuth };
