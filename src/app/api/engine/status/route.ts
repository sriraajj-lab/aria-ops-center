import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const activeAgents = await db.agent.count({
      where: { status: 'available' },
    });

    const lastSetting = await db.setting.findUnique({
      where: { key: 'engine_last_run' },
    });

    const nextSetting = await db.setting.findUnique({
      where: { key: 'engine_next_run' },
    });

    return NextResponse.json({
      lastRun: lastSetting?.value || null,
      nextRun: nextSetting?.value || null,
      activeAgents,
      status: 'running',
    });
  } catch (error) {
    console.error('Engine status error:', error);
    return NextResponse.json({ error: 'Failed to fetch engine status' }, { status: 500 });
  }
}
