/* eslint-disable @typescript-eslint/no-require-imports */
import type { DbInterface } from './db-interface';

let _db: DbInterface | null = null;

export function getDatabase(): DbInterface {
  if (_db) return _db;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { SupabaseDb } = require('./supabase-db');
    _db = new SupabaseDb();
  } else {
    const { SQLiteDb } = require('./sqlite-db');
    _db = new SQLiteDb();
  }
  return _db!;
}
