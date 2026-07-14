const Database = require('better-sqlite3');
const db = new Database('data/timepost.db');

try {
  db.exec('ALTER TABLE email_configs ADD COLUMN email_type TEXT DEFAULT "smtp"');
  console.log('Column email_type added');
} catch(e) {
  console.log('email_type already exists:', e.message);
}

try {
  db.exec('ALTER TABLE email_configs ADD COLUMN yxid TEXT DEFAULT ""');
  console.log('Column yxid added');
} catch(e) {
  console.log('yxid already exists:', e.message);
}

db.close();
console.log('Done');