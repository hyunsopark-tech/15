import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/database';
import type { Patient } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const workflow = searchParams.get('workflow');

    let rows: { id: string; workflow: string; data: string }[];
    if (workflow) {
      rows = db.prepare('SELECT * FROM patients WHERE workflow = ?').all(workflow) as typeof rows;
    } else {
      rows = db.prepare('SELECT * FROM patients').all() as typeof rows;
    }

    const patients: Patient[] = rows.map((r) => JSON.parse(r.data) as Patient);
    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body: { workflow: string; patients: Patient[] } = await request.json();

    const replace = db.transaction((workflow: string, patients: Patient[]) => {
      db.prepare('DELETE FROM patients WHERE workflow = ?').run(workflow);
      const insert = db.prepare('INSERT INTO patients (id, workflow, data) VALUES (?, ?, ?)');
      for (const patient of patients) {
        insert.run(patient.id, workflow, JSON.stringify(patient));
      }
    });

    replace(body.workflow, body.patients);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
