import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const blocks = await getDatabase().getSopBlocks();
    return NextResponse.json(blocks);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDatabase();
    if (body.action === 'upsert') {
      await db.upsertSopBlock({ ...body.block, position: body.block.position ?? 0 });
    } else if (body.action === 'delete') {
      await db.deleteSopBlock(body.id);
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
