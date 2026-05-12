import { NextRequest, NextResponse } from 'next/server';
import { getDeals, createDeal } from '@/lib/db-queries';

export async function GET() {
  try {
    const data = await getDeals();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Deals API error:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const deal = await createDeal(body);
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
