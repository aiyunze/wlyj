const Database = require('better-sqlite3');
const db = new Database('data/timepost.db');
const tableInfo = db.prepare("PRAGMA table_info(email_configs)").all();
console.log(JSON.stringify(tableInfo, null, 2));
db.close();