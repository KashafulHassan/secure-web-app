# Secure Web App

A small Express web app demonstrating secure authentication with protection
against XSS, CSRF, SQL injection, and other common web vulnerabilities,
plus unit tests, e2e tests, and CI.

## Features
- Register / login / logout with session authentication
- Passwords hashed with scrypt + per-user salt (never stored in plaintext)
- CSRF tokens on all state-changing requests
- Parameterized SQL everywhere (no string-built queries)
- Input validation with Zod on the server + HTML5 validation on the client
- Secure headers via Helmet + strict Content-Security-Policy
- Rate limiting on auth routes, generic login errors, no stack-trace leaks

## Quick start
```bash
git clone https://github.com/<your-username>/secure-web-app.git
cd secure-web-app
npm install
cp .env.example .env        # set a real SESSION_SECRET
npm start                   # http://localhost:3000
```

## Tests
```bash
npm test            # Jest unit tests
npx playwright test # Playwright e2e tests (auto-starts the server)
```

## CI
GitHub Actions runs `npm test` and `playwright test` on every push and pull
request to `main`. See `.github/workflows/ci.yml`. Status badge:

![CI](https://github.com/<KashafulHassan>/secure-web-app/actions/workflows/ci.yml/badge.svg)