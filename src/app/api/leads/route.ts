import { NextRequest, NextResponse } from 'next/server';
import { getLeads, createLead } from '@/lib/db-queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const source = searchParams.get('source') || undefined;
    const search = searchParams.get('search') || undefined;

    const leads = await getLeads({ status, source, search });
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lead = await createLead(body);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
