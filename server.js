require("dotenv").config?.();
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { connectDb } = require("./src/db");
const authRoutes = require("./src/routes/auth");
const { csrfProtection, requireAuth } = require("./src/middleware");

const app = express();
connectDb();

// --- Security headers ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    referrerPolicy: { policy: "same-origin" },
    hsts: process.env.NODE_ENV === "production" ? true : false,
  })
);
app.disable("x-powered-by");

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// Basic rate limiting on auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => res.redirect(req.session.userId ? "/dashboard" : "/login"));
app.use(csrfProtection); // must come BEFORE routers so every POST (incl. logout) is protected
app.use("/", authLimiter, authRoutes);
app.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", {
    username: req.session.username,
    csrfToken: req.session.csrfToken,
  });
});
// Central error handler — never leak stack traces to clients
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal server error");
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
}

module.exports = app; // exported for tests