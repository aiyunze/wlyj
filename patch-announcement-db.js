const Database = require('better-sqlite3');
const db = new Database('data/timepost.db');

try {
  db.exec(`
    CREATE TABLE announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT datetime('now'),
      updated_at TEXT DEFAULT datetime('now')
    )
  `);
  console.log('Table announcements created');
} catch(e) {
  console.log('Table announcements already exists:', e.message);
}

db.close();
console.log('Done');