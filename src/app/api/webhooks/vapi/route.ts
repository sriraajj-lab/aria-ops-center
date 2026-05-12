import { NextRequest, NextResponse } from 'next/server';
import { createCallLog, updateLead } from '@/lib/db-queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { call, transcript, summary } = body;

    const determineOutcome = (data: Record<string, unknown>): string => {
      const endedReason = data.endedReason as string || '';
      if (endedReason === 'customer-ended-call' || endedReason === 'user-ended-call') {
        return 'interested';
      }
      if (endedReason === 'no-answer' || endedReason === 'customer-did-not-answer') {
        return 'no-answer';
      }
      if (endedReason === 'customer-busy') {
        return 'busy';
      }
      if (endedReason === 'voicemail') {
        return 'voicemail';
      }
      const duration = (data.duration as number) || 0;
      if (duration > 120) return 'qualified';
      if (duration > 60) return 'callback';
      return 'not-interested';
    };

    const outcome = determineOutcome(call || {});

    if (body.leadId) {
      await createCallLog({
        leadId: body.leadId,
        agentId: body.agentId,
        outcome,
        duration: call?.duration || 0,
        recording: call?.recordingUrl || null,
        transcript: transcript || null,
        summary: summary || null,
      });

      if (outcome === 'qualified') {
        await updateLead(body.leadId, { status: 'qualified', lastContactAt: new Date() });
      } else if (outcome === 'interested' || outcome === 'callback') {
        await updateLead(body.leadId, { status: 'contacted', lastContactAt: new Date() });
      }
    }

    return NextResponse.json({ success: true, outcome });
  } catch (error) {
    console.error('Vapi webhook error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
