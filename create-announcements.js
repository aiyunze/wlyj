const Database = require('better-sqlite3');
const db = new Database('data/timepost.db');

try {
  db.exec(`
    CREATE TABLE announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Table announcements created successfully');
} catch(e) {
  console.log('Error:', e.message);
}

db.close();
console.log('Done');