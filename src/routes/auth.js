const express = require("express");
const { z } = require("zod");
const {
  hashPassword, verifyPassword, createUser, getUserByUsername,
} = require("../db");
const { ensureCsrfToken, requireAuth } = require("../middleware");

const router = express.Router();

// Server-side validation schema (same rules are mirrored on the client)
const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscore allowed"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

router.get("/register", ensureCsrfToken, (req, res) =>
  res.render("register", { error: null, csrfToken: req.session.csrfToken })
);

router.post("/register", (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).render("register", {
      error: parsed.error.issues[0].message,
      csrfToken: req.session.csrfToken || "",
    });
  }
  const { username, password } = parsed.data;
  if (getUserByUsername(username)) {
    return res.status(409).render("register", {
      error: "Username already taken",
      csrfToken: req.session.csrfToken || "",
    });
  }
  const { hash, salt } = hashPassword(password);
  const result = createUser(username, hash, salt);
  req.session.userId = result.lastInsertRowid;
  req.session.username = username;
  res.redirect("/dashboard");
});

router.get("/login", ensureCsrfToken, (req, res) =>
  req.session.userId
    ? res.redirect("/dashboard")
    : res.render("login", { error: null, csrfToken: req.session.csrfToken })
);

router.post("/login", (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).render("login", {
      error: parsed.error.issues[0].message,
      csrfToken: req.session.csrfToken || "",
    });
  }
  const user = getUserByUsername(parsed.data.username);
  // Generic error message — don't reveal whether the username exists
  if (!user || !verifyPassword(parsed.data.password, user.password_salt, user.password_hash)) {
    return res.status(401).render("login", {
      error: "Invalid username or password",
      csrfToken: req.session.csrfToken || "",
    });
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  res.redirect("/dashboard");
});

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

module.exports = router;