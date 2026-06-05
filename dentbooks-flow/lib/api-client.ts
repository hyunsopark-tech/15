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

// ---- Staff ----

export async function apiGetStaff(): Promise<StaffRow[]> {
  try {
    const res = await fetch('/api/staff');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function apiUpsertStaff(staff: StaffRow): Promise<void> {
  try {
    await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', staff }),
    });
  } catch {
    // swallow
  }
}

export async function apiDeleteStaff(id: string): Promise<void> {
  try {
    await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
  } catch {
    // swallow
  }
}

// ---- Patients ----

export async function apiGetPatients(workflow?: string): Promise<Patient[]> {
  try {
    const url = workflow ? `/api/patients?workflow=${encodeURIComponent(workflow)}` : '/api/patients';
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function apiReplacePatients(workflow: string, patients: Patient[]): Promise<void> {
  try {
    await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow, patients }),
    });
  } catch {
    // swallow
  }
}

// ---- Activity Log ----

export async function apiGetActivityLog(): Promise<Record<string, StaffLog>> {
  try {
    const res = await fetch('/api/activity');
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function apiAddActivity(staffId: string, date: string, entry: ActivityEntry): Promise<void> {
  try {
    await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, date, entry }),
    });
  } catch {
    // swallow
  }
}

export async function apiDeleteActivity(id: string): Promise<void> {
  try {
    await fetch(`/api/activity?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch {
    // swallow
  }
}

// ---- Completed Patients ----

export async function apiGetCompleted(): Promise<string[]> {
  try {
    const res = await fetch('/api/completed');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function apiMarkComplete(patientId: string): Promise<void> {
  try {
    await fetch('/api/completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId }),
    });
  } catch {
    // swallow
  }
}

// ---- SOP Blocks ----

export async function apiGetSopBlocks(): Promise<SOPBlock[]> {
  try {
    const res = await fetch('/api/sop');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function apiUpsertSopBlock(block: SOPBlock): Promise<void> {
  try {
    await fetch('/api/sop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', block }),
    });
  } catch {
    // swallow
  }
}

export async function apiDeleteSopBlock(id: string): Promise<void> {
  try {
    await fetch('/api/sop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
  } catch {
    // swallow
  }
}

// ---- Insurance Blocks ----

export async function apiGetInsuranceBlocks(): Promise<InsuranceBlock[]> {
  try {
    const res = await fetch('/api/insurance');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function apiUpsertInsuranceBlock(block: InsuranceBlock): Promise<void> {
  try {
    await fetch('/api/insurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', block }),
    });
  } catch {
    // swallow
  }
}

export async function apiDeleteInsuranceBlock(id: string): Promise<void> {
  try {
    await fetch('/api/insurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
  } catch {
    // swallow
  }
}

// ---- QA ----

export async function apiGetQA(): Promise<{ customQA: QARecord[]; overrides: Record<string, string> }> {
  try {
    const res = await fetch('/api/qa');
    if (!res.ok) return { customQA: [], overrides: {} };
    return await res.json();
  } catch {
    return { customQA: [], overrides: {} };
  }
}

export async function apiUpsertQA(qa: QARecord): Promise<void> {
  try {
    await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsertQA', qa }),
    });
  } catch {
    // swallow
  }
}

export async function apiDeleteQA(id: string): Promise<void> {
  try {
    await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteQA', id }),
    });
  } catch {
    // swallow
  }
}

export async function apiSetOverride(qaId: string, answer: string): Promise<void> {
  try {
    await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setOverride', qaId, answer }),
    });
  } catch {
    // swallow
  }
}

export async function apiClearOverride(qaId: string): Promise<void> {
  try {
    await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clearOverride', qaId }),
    });
  } catch {
    // swallow
  }
}
