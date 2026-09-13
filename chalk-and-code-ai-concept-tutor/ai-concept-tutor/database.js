// database.js
// Stores a history of concepts students (or you) have looked up, so the
// app has a real database in the loop — not just a stateless AI call.

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tutor.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS lookups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept TEXT NOT NULL,
    level TEXT NOT NULL,
    explanation TEXT NOT NULL,
    analogy TEXT NOT NULL,
    practice_question TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
