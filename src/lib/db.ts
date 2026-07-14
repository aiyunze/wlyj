export interface D1PreparedStatement {
  all<T = unknown>(params?: unknown[]): Promise<T[]>;
  get<T = unknown>(params?: unknown[]): Promise<T | null>;
  run(params?: unknown[]): Promise<{ changes: number; lastInsertRowid?: number }>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  exec(sql: string): Promise<void>;
}

let db: D1Database | null = null;

async function createSqliteDb(): Promise<D1Database> {
  const { default: Database } = await import("better-sqlite3");
  const { existsSync, mkdirSync } = await import("fs");
  const { dirname } = await import("path");
  const { cwd } = await import("process");

  const dbPath = `${cwd()}/data/timepost.db`;
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const sqliteDb = new Database(dbPath);
  sqliteDb.pragma("journal_mode = WAL");
  sqliteDb.pragma("foreign_keys = ON");

  const wrap = (stmt: any): D1PreparedStatement => ({
    all<T>(params?: unknown[]): Promise<T[]> {
      return Promise.resolve(stmt.all(...(params || [])) as T[]);
    },
    get<T>(params?: unknown[]): Promise<T | null> {
      const r = stmt.get(...(params || [])) as T | undefined;
      return Promise.resolve(r ?? null);
    },
    run(params?: unknown[]): Promise<{ changes: number; lastInsertRowid?: number }> {
      const r = stmt.run(...(params || []));
      return Promise.resolve({ changes: r.changes, lastInsertRowid: r.lastInsertRowid });
    },
  });

  return {
    prepare(sql: string): D1PreparedStatement {
      return wrap(sqliteDb.prepare(sql));
    },
    exec(sql: string): Promise<void> {
      sqliteDb.exec(sql);
      return Promise.resolve();
    },
  };
}

export async function getDb(): Promise<D1Database> {
  if (!db) {
    if (process.env.NODE_ENV === "development" && !(globalThis as any).DB) {
      db = await createSqliteDb();
    } else {
      const d1Db = (globalThis as any).DB as D1Database;
      if (!d1Db) {
        throw new Error("D1 database binding not found");
      }
      db = d1Db;
    }
    await initTables(db);
  }
  return db;
}

async function initTables(db: D1Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS letters (
      id TEXT PRIMARY KEY,
      letter_no TEXT UNIQUE DEFAULT '',
      recipient_email TEXT NOT NULL,
      recipient_name TEXT NOT NULL DEFAULT '',
      sender_name TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      send_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      sent_at TEXT,
      error_msg TEXT,
      email_config_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      smtp_host TEXT NOT NULL,
      smtp_port INTEGER NOT NULL DEFAULT 587,
      smtp_user TEXT NOT NULL,
      smtp_pass TEXT NOT NULL,
      from_name TEXT NOT NULL DEFAULT '',
      from_email TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      email_type TEXT NOT NULL DEFAULT 'smtp',
      yxid TEXT UNIQUE DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_letters_status_send_at ON letters(status, send_at);
    CREATE INDEX IF NOT EXISTS idx_email_configs_active ON email_configs(is_active);

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      letter_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('image', 'audio')),
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      storage_provider TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      storage_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active', 'expiring', 'expired', 'pending_delete', 'deleted')),
      uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_letter_id ON attachments(letter_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_status ON attachments(status);
    CREATE INDEX IF NOT EXISTS idx_attachments_expires_at ON attachments(expires_at);
  `);

  await initDefaultSettings(db);
  await migrateLetterNo(db);
  await migrateEmailConfigs(db);
}

async function migrateLetterNo(db: D1Database) {
  try {
    await db.exec(`ALTER TABLE letters ADD COLUMN letter_no TEXT UNIQUE DEFAULT ''`);
  } catch {
    // column already exists
  }
  const rows = await db.prepare<{ id: string }>("SELECT id FROM letters WHERE letter_no IS NULL OR letter_no = ''").all();
  for (const row of rows) {
    const seq = await db.prepare<{ c: number }>("SELECT COUNT(*) as c FROM letters WHERE letter_no != ''").get();
    const count = seq?.c ?? 0;
    const no = `G${String(count + 1).padStart(6, "0")}`;
    await db.prepare("UPDATE letters SET letter_no = ? WHERE id = ?").run(no, row.id);
  }
}

async function migrateEmailConfigs(db: D1Database) {
  try {
    await db.exec(`ALTER TABLE email_configs ADD COLUMN email_type TEXT NOT NULL DEFAULT 'smtp'`);
  } catch {
    // column already exists
  }
  try {
    await db.exec(`ALTER TABLE email_configs ADD COLUMN yxid TEXT UNIQUE DEFAULT ''`);
  } catch {
    // column already exists
  }
  const rows = await db.prepare<{ id: string }>("SELECT id FROM email_configs WHERE yxid IS NULL OR yxid = ''").all();
  for (const row of rows) {
    const seq = await db.prepare<{ c: number }>("SELECT COUNT(*) as c FROM email_configs WHERE yxid != ''").get();
    const count = seq?.c ?? 0;
    const yxid = String(count + 1).padStart(6, "0");
    await db.prepare("UPDATE email_configs SET yxid = ? WHERE id = ?").run(yxid, row.id);
  }
}

async function initDefaultSettings(db: D1Database) {
  await db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
  ).run("storage_provider", "r2");
  await db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("storage_r2_config", "{}");
  await db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("storage_cos_config", "{}");
  await db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("storage_oss_config", "{}");
  await db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("storage_kodo_config", "{}");
}