import getDb from './database';
import type { DbInterface, StaffRow, PatientRow, ActivityRow, BlockRow, QARow, OverrideRow } from './db-interface';

export class SQLiteDb implements DbInterface {
  async getAllStaff(): Promise<StaffRow[]> {
    return getDb().prepare('SELECT * FROM staff ORDER BY position ASC').all() as StaffRow[];
  }
  async upsertStaff(s: StaffRow): Promise<void> {
    getDb().prepare('INSERT OR REPLACE INTO staff (id, name, role, color, initials, position) VALUES (?, ?, ?, ?, ?, ?)').run(s.id, s.name, s.role, s.color, s.initials, s.position ?? 0);
  }
  async deleteStaff(id: string): Promise<void> {
    getDb().prepare('DELETE FROM staff WHERE id = ?').run(id);
  }

  async getPatients(workflow?: string): Promise<PatientRow[]> {
    const db = getDb();
    if (workflow) {
      return db.prepare('SELECT * FROM patients WHERE workflow = ?').all(workflow) as PatientRow[];
    }
    return db.prepare('SELECT * FROM patients').all() as PatientRow[];
  }
  async replacePatients(workflow: string, rows: PatientRow[]): Promise<void> {
    const db = getDb();
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM patients WHERE workflow = ?').run(workflow);
      const ins = db.prepare('INSERT INTO patients (id, workflow, data) VALUES (?, ?, ?)');
      for (const r of rows) ins.run(r.id, r.workflow, r.data);
    });
    tx();
  }

  async getAllActivity(): Promise<ActivityRow[]> {
    return getDb().prepare('SELECT * FROM activity_log ORDER BY rowid ASC').all() as ActivityRow[];
  }
  async insertActivity(row: ActivityRow): Promise<void> {
    getDb().prepare('INSERT INTO activity_log (id, staff_id, date, type, description, time_label) VALUES (?, ?, ?, ?, ?, ?)').run(row.id, row.staff_id, row.date, row.type, row.description, row.time_label);
  }
  async deleteActivity(id: string): Promise<void> {
    getDb().prepare('DELETE FROM activity_log WHERE id = ?').run(id);
  }

  async getCompleted(): Promise<string[]> {
    const rows = getDb().prepare('SELECT patient_id FROM completed_patients').all() as { patient_id: string }[];
    return rows.map(r => r.patient_id);
  }
  async markComplete(patientId: string): Promise<void> {
    getDb().prepare('INSERT OR IGNORE INTO completed_patients (patient_id) VALUES (?)').run(patientId);
  }

  async getSopBlocks(): Promise<BlockRow[]> {
    return getDb().prepare('SELECT * FROM sop_blocks ORDER BY position ASC').all() as BlockRow[];
  }
  async upsertSopBlock(b: BlockRow): Promise<void> {
    getDb().prepare('INSERT OR REPLACE INTO sop_blocks (id, title, body, position) VALUES (?, ?, ?, ?)').run(b.id, b.title, b.body, b.position ?? 0);
  }
  async deleteSopBlock(id: string): Promise<void> {
    getDb().prepare('DELETE FROM sop_blocks WHERE id = ?').run(id);
  }

  async getInsuranceBlocks(): Promise<BlockRow[]> {
    return getDb().prepare('SELECT * FROM insurance_blocks ORDER BY position ASC').all() as BlockRow[];
  }
  async upsertInsuranceBlock(b: BlockRow): Promise<void> {
    getDb().prepare('INSERT OR REPLACE INTO insurance_blocks (id, title, body, position) VALUES (?, ?, ?, ?)').run(b.id, b.title, b.body, b.position ?? 0);
  }
  async deleteInsuranceBlock(id: string): Promise<void> {
    getDb().prepare('DELETE FROM insurance_blocks WHERE id = ?').run(id);
  }

  async getCustomQA(): Promise<QARow[]> {
    return getDb().prepare('SELECT * FROM custom_qa').all() as QARow[];
  }
  async upsertQA(row: QARow): Promise<void> {
    getDb().prepare('INSERT OR REPLACE INTO custom_qa (id, data) VALUES (?, ?)').run(row.id, row.data);
  }
  async deleteQA(id: string): Promise<void> {
    getDb().prepare('DELETE FROM custom_qa WHERE id = ?').run(id);
  }

  async getOverrides(): Promise<OverrideRow[]> {
    return getDb().prepare('SELECT * FROM qa_overrides').all() as OverrideRow[];
  }
  async setOverride(qaId: string, answer: string): Promise<void> {
    getDb().prepare('INSERT OR REPLACE INTO qa_overrides (qa_id, answer) VALUES (?, ?)').run(qaId, answer);
  }
  async clearOverride(qaId: string): Promise<void> {
    getDb().prepare('DELETE FROM qa_overrides WHERE qa_id = ?').run(qaId);
  }
}
