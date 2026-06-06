import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const workflow = new URL(req.url).searchParams.get('workflow') ?? undefined;
    const rows = await getDatabase().getPatients(workflow);
    const patients = rows.map(r => JSON.parse(r.data));
    return NextResponse.json(patients);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workflow, patients } = await req.json();
    const rows = patients.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      workflow,
      data: JSON.stringify(p),
    }));
    await getDatabase().replacePatients(workflow, rows);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
