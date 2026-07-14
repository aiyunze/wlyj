const Database = require('better-sqlite3');
const db = new Database('data/timepost.db');

try {
  db.exec('ALTER TABLE email_configs ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1');
  console.log('Column is_active added');
} catch(e) {
  console.log('is_active already exists:', e.message);
}

try {
  db.exec('ALTER TABLE email_configs ADD COLUMN from_name TEXT DEFAULT ""');
  console.log('Column from_name added');
} catch(e) {
  console.log('from_name already exists');
}

try {
  db.exec('ALTER TABLE email_configs ADD COLUMN from_email TEXT DEFAULT ""');
  console.log('Column from_email added');
} catch(e) {
  console.log('from_email already exists');
}

db.close();
console.log('Done');