const crypto = require("crypto");

// Synchronizer (session-based) CSRF token pattern
function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const sessionToken = req.session.csrfToken;
  const submitted = req.body?._csrf || req.headers["x-csrf-token"];
  if (!sessionToken || !submitted || !timingSafeCompare(sessionToken, submitted)) {
    return res.status(403).send("CSRF token missing or invalid");
  }
  next();
}

function timingSafeCompare(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function ensureCsrfToken(req, res, next) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect("/login");
  next();
}

module.exports = { csrfProtection, ensureCsrfToken, requireAuth };