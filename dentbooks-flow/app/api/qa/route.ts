import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();
    const [qaRows, overrideRows] = await Promise.all([db.getCustomQA(), db.getOverrides()]);
    const customQA = qaRows.map(r => JSON.parse(r.data));
    const overrides: Record<string, string> = {};
    for (const o of overrideRows) overrides[o.qa_id] = o.answer;
    return NextResponse.json({ customQA, overrides });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDatabase();
    if (body.action === 'upsertQA') await db.upsertQA({ id: body.qa.id, data: JSON.stringify(body.qa) });
    else if (body.action === 'deleteQA') await db.deleteQA(body.id);
    else if (body.action === 'setOverride') await db.setOverride(body.qaId, body.answer);
    else if (body.action === 'clearOverride') await db.clearOverride(body.qaId);
    else return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
