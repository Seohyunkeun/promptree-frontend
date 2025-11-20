// server/db.js
// SQLite에 key-value 형태로 JSON 통짜 저장 (posts 배열)

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.join(__dirname, "promptree.db");
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)"
  );
});

function getValue(key) {
  return new Promise((resolve, reject) => {
    db.get("SELECT value FROM kv WHERE key = ?", [key], (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.value : null);
    });
  });
}

function setValue(key, value) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [key, value],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

async function getPosts() {
  const raw = await getValue("posts");
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error("Failed to parse posts JSON:", e);
    return [];
  }
}

async function savePosts(posts) {
  await setValue("posts", JSON.stringify(posts || []));
}

module.exports = {
  db,
  getPosts,
  savePosts,
};
