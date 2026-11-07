# Security Checklist

| # | Risk | How it is handled | Where |
|---|------|-------------------|-------|
| 1 | SQL Injection | All queries use prepared statements with `?` placeholders; no string concatenation of user input into SQL. Also blocked earlier by strict username validation (regex `[a-zA-Z0-9_]`). | `src/db.js`, `src/routes/auth.js` |
| 2 | XSS | EJS auto-escapes output (`<%= %>`); strict CSP (`script-src 'self'`, no inline scripts); inputs validated/whitelisted server-side. No `innerHTML` / raw HTML rendering of user data. | `views/*.ejs`, `server.js` (Helmet/CSP) |
| 3 | CSRF | Synchronizer token pattern: random 32-byte token per session, embedded as hidden input, verified with a timing-safe compare on every POST. Sessions use `SameSite=Lax` cookies. | `src/middleware.js`, all forms |
| 4 | Weak password storage | scrypt hashing with per-user random salt; verification uses `crypto.timingSafeEqual`. No plaintext or reversible storage. | `src/db.js` |
| 5 | Missing input validation | Zod schema validates username (3–30 chars, `[a-zA-Z0-9_]`) and password (8–128 chars) server-side; HTML5 `required`/`pattern`/`minlength` validate on the client. | `src/routes/auth.js`, `views/*.ejs` |
| 6 | Insecure headers / CSP | Helmet sets X-Frame-Options, nosniff, HSTS (prod), referrer-policy; strict CSP blocks inline and third-party scripts. | `server.js` |
| 7 | Session hijacking / fixation | `httpOnly` + `SameSite=Lax` + `secure` (prod) session cookies; session destroyed on logout; secret from env var. | `server.js` |
| 8 | Brute force / credential stuffing | Rate limit of 20 requests / 15 min on auth routes via express-rate-limit. | `server.js` |
| 9 | User enumeration | Login always returns the same generic "Invalid username or password" message and status. | `src/routes/auth.js` |
| 10 | Information disclosure | `x-powered-by` disabled; central error handler returns a generic 500 without stack traces. | `server.js` |