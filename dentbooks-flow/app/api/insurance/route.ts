import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/database';

interface InsuranceBlock {
  id: string;
  title: string;
  body: string;
  position: number;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM insurance_blocks ORDER BY position ASC').all();
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
      const block: InsuranceBlock = body.block;
      db.prepare(
        'INSERT OR REPLACE INTO insurance_blocks (id, title, body, position) VALUES (?, ?, ?, ?)'
      ).run(block.id, block.title, block.body, block.position ?? 0);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'delete') {
      db.prepare('DELETE FROM insurance_blocks WHERE id = ?').run(body.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
