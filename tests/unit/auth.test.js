process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-secret";
const request = require("supertest");
const path = require("path");
const fs = require("fs");

// Fresh DB per run
const dataDir = path.join(__dirname, "..", "..", "data");
if (fs.existsSync(dataDir)) fs.rmSync(dataDir, { recursive: true });

const app = require("../../server");
const { verifyPassword, hashPassword } = require("../../src/db");

describe("password hashing", () => {
  test("hashes and verifies a password correctly", () => {
    const { hash, salt } = hashPassword("correct horse battery");
    expect(verifyPassword("correct horse battery", salt, hash)).toBe(true);
  });
  test("rejects a wrong password", () => {
    const { hash, salt } = hashPassword("correct horse battery");
    expect(verifyPassword("wrongpass123", salt, hash)).toBe(false);
  });
});

describe("registration and login API", () => {
  let agent;
  let csrfToken;

  beforeAll(async () => {
    // Get a session + real CSRF token first (mirrors a real browser)
    agent = request.agent(app);
    const res = await agent.get("/login");
    const match = res.text.match(/name="_csrf" value="([a-f0-9]+)"/);
    csrfToken = match ? match[1] : "x";
  });

  test("registers a valid user and sets a session", async () => {
    const res = await agent.post("/register").type("form").send({
      username: "alice", password: "password123", _csrf: csrfToken,
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/dashboard");
  });

  test("rejects weak password (server-side validation)", async () => {
    const res = await agent.post("/register").type("form").send({
      username: "bob", password: "short", _csrf: csrfToken,
    });
    expect(res.status).toBe(400);
  });

  test("rejects SQL injection payload in username", async () => {
    const res = await agent.post("/register").type("form").send({
      username: "admin'--", password: "password123", _csrf: csrfToken,
    });
    expect(res.status).toBe(400); // validation blocks it before any query
  });

  test("blocks a POST with a missing/invalid CSRF token", async () => {
    const res = await agent.post("/register").type("form").send({
      username: "carol", password: "password123", _csrf: "bad-token",
    });
    expect(res.status).toBe(403);
  });

  test("returns 401 for wrong credentials", async () => {
    const res = await agent.post("/login").type("form").send({
      username: "alice", password: "wrongpassword1", _csrf: csrfToken,
    });
    expect(res.status).toBe(401);
  });

  test("redirects unauthenticated users away from /dashboard", async () => {
    const res = await request(app).get("/dashboard");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });
});