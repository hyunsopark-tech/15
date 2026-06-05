import { createClient } from '@supabase/supabase-js';
import type { DbInterface, StaffRow, PatientRow, ActivityRow, BlockRow, QARow, OverrideRow } from './db-interface';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  return createClient(url, key, { auth: { persistSession: false } });
}

export class SupabaseDb implements DbInterface {
  async getAllStaff(): Promise<StaffRow[]> {
    const { data } = await getClient().from('staff').select('*').order('position');
    return (data ?? []) as StaffRow[];
  }
  async upsertStaff(s: StaffRow): Promise<void> {
    await getClient().from('staff').upsert(s);
  }
  async deleteStaff(id: string): Promise<void> {
    await getClient().from('staff').delete().eq('id', id);
  }

  async getPatients(workflow?: string): Promise<PatientRow[]> {
    let q = getClient().from('patients').select('*');
    if (workflow) q = q.eq('workflow', workflow);
    const { data } = await q;
    return (data ?? []) as PatientRow[];
  }
  async replacePatients(workflow: string, rows: PatientRow[]): Promise<void> {
    const client = getClient();
    await client.from('patients').delete().eq('workflow', workflow);
    if (rows.length > 0) await client.from('patients').insert(rows);
  }

  async getAllActivity(): Promise<ActivityRow[]> {
    const { data } = await getClient().from('activity_log').select('*').order('id');
    return (data ?? []) as ActivityRow[];
  }
  async insertActivity(row: ActivityRow): Promise<void> {
    await getClient().from('activity_log').insert(row);
  }
  async deleteActivity(id: string): Promise<void> {
    await getClient().from('activity_log').delete().eq('id', id);
  }

  async getCompleted(): Promise<string[]> {
    const { data } = await getClient().from('completed_patients').select('patient_id');
    return (data ?? []).map((r: { patient_id: string }) => r.patient_id);
  }
  async markComplete(patientId: string): Promise<void> {
    await getClient().from('completed_patients').upsert({ patient_id: patientId });
  }

  async getSopBlocks(): Promise<BlockRow[]> {
    const { data } = await getClient().from('sop_blocks').select('*').order('position');
    return (data ?? []) as BlockRow[];
  }
  async upsertSopBlock(b: BlockRow): Promise<void> {
    await getClient().from('sop_blocks').upsert(b);
  }
  async deleteSopBlock(id: string): Promise<void> {
    await getClient().from('sop_blocks').delete().eq('id', id);
  }

  async getInsuranceBlocks(): Promise<BlockRow[]> {
    const { data } = await getClient().from('insurance_blocks').select('*').order('position');
    return (data ?? []) as BlockRow[];
  }
  async upsertInsuranceBlock(b: BlockRow): Promise<void> {
    await getClient().from('insurance_blocks').upsert(b);
  }
  async deleteInsuranceBlock(id: string): Promise<void> {
    await getClient().from('insurance_blocks').delete().eq('id', id);
  }

  async getCustomQA(): Promise<QARow[]> {
    const { data } = await getClient().from('custom_qa').select('*');
    return (data ?? []) as QARow[];
  }
  async upsertQA(row: QARow): Promise<void> {
    await getClient().from('custom_qa').upsert(row);
  }
  async deleteQA(id: string): Promise<void> {
    await getClient().from('custom_qa').delete().eq('id', id);
  }

  async getOverrides(): Promise<OverrideRow[]> {
    const { data } = await getClient().from('qa_overrides').select('*');
    return (data ?? []) as OverrideRow[];
  }
  async setOverride(qaId: string, answer: string): Promise<void> {
    await getClient().from('qa_overrides').upsert({ qa_id: qaId, answer });
  }
  async clearOverride(qaId: string): Promise<void> {
    await getClient().from('qa_overrides').delete().eq('qa_id', qaId);
  }
}
