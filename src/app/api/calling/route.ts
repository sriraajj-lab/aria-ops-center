import { NextRequest, NextResponse } from 'next/server';
import { getCallingData, createAgent, updateAgent } from '@/lib/db-queries';

export async function GET() {
  try {
    const data = await getCallingData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Calling API error:', error);
    return NextResponse.json({ error: 'Failed to fetch calling data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.id) {
      const { id, ...data } = body;
      const agent = await updateAgent(id, data);
      return NextResponse.json(agent);
    }
    const agent = await createAgent(body);
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Create/update agent error:', error);
    return NextResponse.json({ error: 'Failed to create/update agent' }, { status: 500 });
  }
}
