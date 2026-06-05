import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/database';

interface QARecord {
  id: string;
  category: string;
  keywords: string[];
  question: string;
  script: string;
  tips?: string;
  followUp?: string;
  isCustom?: boolean;
  isEdited?: boolean;
}

export async function GET() {
  try {
    const db = getDb();
    const qaRows = db.prepare('SELECT * FROM custom_qa').all() as { id: string; data: string }[];
    const overrideRows = db.prepare('SELECT * FROM qa_overrides').all() as { qa_id: string; answer: string }[];

    const customQA: QARecord[] = qaRows.map((r) => JSON.parse(r.data) as QARecord);
    const overrides: Record<string, string> = {};
    for (const row of overrideRows) {
      overrides[row.qa_id] = row.answer;
    }

    return NextResponse.json({ customQA, overrides });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    if (body.action === 'upsertQA') {
      const qa: QARecord = body.qa;
      db.prepare('INSERT OR REPLACE INTO custom_qa (id, data) VALUES (?, ?)').run(qa.id, JSON.stringify(qa));
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'deleteQA') {
      db.prepare('DELETE FROM custom_qa WHERE id = ?').run(body.id);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'setOverride') {
      db.prepare('INSERT OR REPLACE INTO qa_overrides (qa_id, answer) VALUES (?, ?)').run(body.qaId, body.answer);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'clearOverride') {
      db.prepare('DELETE FROM qa_overrides WHERE qa_id = ?').run(body.qaId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
