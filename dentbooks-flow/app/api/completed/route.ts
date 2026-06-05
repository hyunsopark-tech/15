import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/database';

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT patient_id FROM completed_patients').all() as { patient_id: string }[];
    return NextResponse.json(rows.map((r) => r.patient_id));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body: { patientId: string } = await request.json();
    db.prepare('INSERT OR IGNORE INTO completed_patients (patient_id) VALUES (?)').run(body.patientId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
