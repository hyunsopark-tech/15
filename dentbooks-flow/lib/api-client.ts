import type { Patient } from '@/lib/types';

export type StaffRow = {
  id: string;
  name: string;
  role: string;
  color: string;
  initials: string;
  position?: number;
};

export type StaffLog = {
  staffId: string;
  date: string;
  entries: ActivityEntry[];
};

export type ActivityEntry = {
  id: string;
  type: string;
  description: string;
  timeLabel: string;
};

export type SOPBlock = {
  id: string;
  title: string;
  body: string;
  position?: number;
};

export type InsuranceBlock = {
  id: string;
  title: string;
  body: string;
  position?: number;
};

export type QARecord = {
  id: string;
  category: string;
  keywords: string[];
  question: string;
  script: string;
  tips?: string;
  followUp?: string;
  isCustom?: boolean;
  isEdited?: boolean;
};

// ── localStorage helpers (used when API is unavailable) ───────────────────────

const LS = {
  staff:     'dentbooks-staff-list',
  activity:  'dentbooks-activity-log',
  completed: 'dentbooks-completed-patients',
  patients:  'dentbooks-patients',
};

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function lsSave<T>(key: string, val: T): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export async function apiGetStaff(): Promise<StaffRow[]> {
  try {
    const res = await fetch('/api/staff');
    if (res.ok) {
      const data: StaffRow[] = await res.json();
      if (data.length > 0) return data;
    }
  } catch { /* fall through */ }
  // Fallback: localStorage
  return lsGet<StaffRow[]>(LS.staff, []);
}

export async function apiUpsertStaff(staff: StaffRow): Promise<void> {
  // Always save to localStorage first
  const list = lsGet<StaffRow[]>(LS.staff, []);
  const idx = list.findIndex(s => s.id === staff.id);
  if (idx >= 0) list[idx] = staff; else list.push(staff);
  lsSave(LS.staff, list);
  // Try API (fire-and-forget)
  try {
    await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', staff }),
    });
  } catch { /* swallow */ }
}

export async function apiDeleteStaff(id: string): Promise<void> {
  // Always update localStorage first
  const list = lsGet<StaffRow[]>(LS.staff, []).filter(s => s.id !== id);
  lsSave(LS.staff, list);
  // Try API
  try {
    await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
  } catch { /* swallow */ }
}

// ── Patients ──────────────────────────────────────────────────────────────────

export async function apiGetPatients(workflow?: string): Promise<Patient[]> {
  // Try API first (Supabase mode)
  try {
    const url = workflow ? `/api/patients?workflow=${encodeURIComponent(workflow)}` : '/api/patients';
    const res = await fetch(url);
    if (res.ok) {
      const data: Patient[] = await res.json();
      if (data.length > 0) return data;
    }
  } catch { /* fall through */ }
  // Fallback: localStorage
  const all = lsGet<Patient[]>(LS.patients, []);
  return workflow ? all.filter(p => p.workflow === workflow) : all;
}

export async function apiReplacePatients(workflow: string, patients: Patient[]): Promise<void> {
  // Always save to localStorage
  const all = lsGet<Patient[]>(LS.patients, []).filter(p => p.workflow !== workflow);
  lsSave(LS.patients, [...all, ...patients]);
  // Try API
  try {
    await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow, patients }),
    });
  } catch { /* swallow */ }
}

// ── Activity Log ──────────────────────────────────────────────────────────────

export async function apiGetActivityLog(): Promise<Record<string, StaffLog>> {
  // Always read localStorage first — it's instant and always up to date
  const localData = lsGet<Record<string, StaffLog>>(LS.activity, {});
  // If API has data (Supabase mode), merge it in — API entries take precedence
  try {
    const res = await fetch('/api/activity');
    if (res.ok) {
      const apiData: Record<string, StaffLog> = await res.json();
      if (Object.keys(apiData).length > 0) {
        // Merge: keep local entries that aren't in API yet (just written), plus all API entries
        return { ...localData, ...apiData };
      }
    }
  } catch { /* fall through */ }
  return localData;
}

export async function apiAddActivity(staffId: string, date: string, entry: ActivityEntry): Promise<void> {
  // Always save to localStorage
  const logs = lsGet<Record<string, StaffLog>>(LS.activity, {});
  const key = `${staffId}:${date}`;
  if (!logs[key]) logs[key] = { staffId, date, entries: [] };
  logs[key].entries.push(entry);
  lsSave(LS.activity, logs);
  // Try API
  try {
    await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, date, entry }),
    });
  } catch { /* swallow */ }
}

export async function apiDeleteActivity(id: string): Promise<void> {
  // Always update localStorage
  const logs = lsGet<Record<string, StaffLog>>(LS.activity, {});
  for (const key of Object.keys(logs)) {
    logs[key].entries = logs[key].entries.filter(e => e.id !== id);
  }
  lsSave(LS.activity, logs);
  // Try API
  try {
    await fetch(`/api/activity?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch { /* swallow */ }
}

// ── Completed Patients ────────────────────────────────────────────────────────

export async function apiGetCompleted(): Promise<string[]> {
  try {
    const res = await fetch('/api/completed');
    if (res.ok) {
      const data: string[] = await res.json();
      if (data.length > 0) return data;
    }
  } catch { /* fall through */ }
  return lsGet<string[]>(LS.completed, []);
}

export async function apiMarkComplete(patientId: string): Promise<void> {
  // Always save to localStorage
  const ids = lsGet<string[]>(LS.completed, []);
  if (!ids.includes(patientId)) { ids.push(patientId); lsSave(LS.completed, ids); }
  // Try API
  try {
    await fetch('/api/completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId }),
    });
  } catch { /* swallow */ }
}

// ── SOP Blocks ────────────────────────────────────────────────────────────────
// CallCenter.tsx handles its own localStorage for SOP/Insurance/QA.
// These API functions are supplementary — failures are silent.

export async function apiGetSopBlocks(): Promise<SOPBlock[]> {
  try {
    const res = await fetch('/api/sop');
    if (res.ok) return await res.json();
  } catch { /* fall through */ }
  return [];
}

export async function apiUpsertSopBlock(block: SOPBlock): Promise<void> {
  try {
    await fetch('/api/sop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', block }),
    });
  } catch { /* swallow */ }
}

export async function apiDeleteSopBlock(id: string): Promise<void> {
  try {
    await fetch('/api/sop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
  } catch { /* swallow */ }
}

// ── Insurance Blocks ──────────────────────────────────────────────────────────

export async function apiGetInsuranceBlocks(): Promise<InsuranceBlock[]> {
  try {
    const res = await fetch('/api/insurance');
    if (res.ok) return await res.json();
  } catch { /* fall through */ }
  return [];
}

export async function apiUpsertInsuranceBlock(block: InsuranceBlock): Promise<void> {
  try {
    await fetch('/api/insurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', block }),
    });
  } catch { /* swallow */ }
}

export async function apiDeleteInsuranceBlock(id: string): Promise<void> {
  try {
    await fetch('/api/insurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
  } catch { /* swallow */ }
}

// ── QA ────────────────────────────────────────────────────────────────────────

export async function apiGetQA(): Promise<{ customQA: QARecord[]; overrides: Record<string, string> }> {
  try {
    const res = await fetch('/api/qa');
    if (res.ok) return await res.json();
  } catch { /* fall through */ }
  return { customQA: [], overrides: {} };
}

export async function apiUpsertQA(qa: QARecord): Promise<void> {
  try {
    await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsertQA', qa }),
    });
  } catch { /* swallow */ }
}

export async function apiDeleteQA(id: string): Promise<void> {
  try {
    await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteQA', id }),
    });
  } catch { /* swallow */ }
}

export async function apiSetOverride(qaId: string, answer: string): Promise<void> {
  try {
    await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setOverride', qaId, answer }),
    });
  } catch { /* swallow */ }
}

export async function apiClearOverride(qaId: string): Promise<void> {
  try {
    await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clearOverride', qaId }),
    });
  } catch { /* swallow */ }
}
