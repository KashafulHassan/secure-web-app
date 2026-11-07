const { DatabaseSync } = require("node:sqlite");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

let db;

function connectDb() {
  const dir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  db = new DatabaseSync(path.join(dir, "app.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL
    );
  `);
  return db;
}

// scrypt password hashing (no plaintext ever stored)
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ALWAYS use prepared statements with placeholders — never string concatenation
function createUser(username, hash, salt) {
  return db
    .prepare("INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?)")
    .run(username, hash, salt);
}

function getUserByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

module.exports = { connectDb, hashPassword, verifyPassword, createUser, getUserByUsername };