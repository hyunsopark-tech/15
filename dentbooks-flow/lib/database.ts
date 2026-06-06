import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'dentbooks.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      color TEXT NOT NULL,
      initials TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      workflow TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      time_label TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_activity_staff_date ON activity_log(staff_id, date);

    CREATE TABLE IF NOT EXISTS completed_patients (
      patient_id TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS sop_blocks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS insurance_blocks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS custom_qa (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS qa_overrides (
      qa_id TEXT PRIMARY KEY,
      answer TEXT NOT NULL
    );
  `);
}

export default getDb;
