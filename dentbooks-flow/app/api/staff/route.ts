import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/database';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  color: string;
  initials: string;
  position?: number;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM staff ORDER BY position ASC').all();
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    if (body.action === 'upsert') {
      const staff: StaffMember = body.staff;
      db.prepare(
        'INSERT OR REPLACE INTO staff (id, name, role, color, initials, position) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(staff.id, staff.name, staff.role, staff.color, staff.initials, staff.position ?? 0);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'delete') {
      db.prepare('DELETE FROM staff WHERE id = ?').run(body.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
