import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/database';

interface ActivityEntry {
  id: string;
  type: string;
  description: string;
  timeLabel: string;
}

interface StaffLog {
  staffId: string;
  date: string;
  entries: ActivityEntry[];
}

interface ActivityRow {
  id: string;
  staff_id: string;
  date: string;
  type: string;
  description: string;
  time_label: string;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM activity_log ORDER BY rowid ASC').all() as ActivityRow[];

    const result: Record<string, StaffLog> = {};
    for (const row of rows) {
      const key = `${row.staff_id}:${row.date}`;
      if (!result[key]) {
        result[key] = { staffId: row.staff_id, date: row.date, entries: [] };
      }
      result[key].entries.push({
        id: row.id,
        type: row.type,
        description: row.description,
        timeLabel: row.time_label,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body: { staffId: string; date: string; entry: ActivityEntry } = await request.json();
    const { staffId, date, entry } = body;

    db.prepare(
      'INSERT INTO activity_log (id, staff_id, date, type, description, time_label) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(entry.id, staffId, date, entry.type, entry.description, entry.timeLabel);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    db.prepare('DELETE FROM activity_log WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
