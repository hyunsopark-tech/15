import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const rows = await getDatabase().getAllActivity();
    const result: Record<string, { staffId: string; date: string; entries: { id: string; type: string; description: string; timeLabel: string }[] }> = {};
    for (const row of rows) {
      const key = `${row.staff_id}:${row.date}`;
      if (!result[key]) result[key] = { staffId: row.staff_id, date: row.date, entries: [] };
      result[key].entries.push({ id: row.id, type: row.type, description: row.description, timeLabel: row.time_label });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { staffId, date, entry } = await req.json();
    await getDatabase().insertActivity({ id: entry.id, staff_id: staffId, date, type: entry.type, description: entry.description, time_label: entry.timeLabel });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')!;
    await getDatabase().deleteActivity(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
