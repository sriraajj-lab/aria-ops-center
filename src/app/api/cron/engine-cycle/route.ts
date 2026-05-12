import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { upsertSetting } from '@/lib/db-queries';

export async function GET() {
  try {
    const now = new Date();

    const staleLeads = await db.lead.findMany({
      where: {
        status: 'new',
        createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    const availableAgents = await db.agent.findMany({
      where: { type: 'calling', status: 'available' },
    });

    const scheduledContacts = await db.contactAttempt.findMany({
      where: {
        status: 'pending',
        scheduledAt: { lte: now },
      },
      include: { lead: true },
    });

    await upsertSetting('engine_last_run', now.toISOString());
    await upsertSetting('engine_next_run', new Date(now.getTime() + 60 * 60 * 1000).toISOString());

    return NextResponse.json({
      success: true,
      processedAt: now.toISOString(),
      staleLeads: staleLeads.length,
      availableAgents: availableAgents.length,
      scheduledContacts: scheduledContacts.length,
      actions: {
        leadsToContact: staleLeads.length,
        agentsAvailable: availableAgents.length,
        pendingContactAttempts: scheduledContacts.length,
      },
    });
  } catch (error) {
    console.error('Engine cycle error:', error);
    return NextResponse.json({ error: 'Failed to run engine cycle' }, { status: 500 });
  }
}
