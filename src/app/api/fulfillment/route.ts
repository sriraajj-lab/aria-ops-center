import { NextResponse } from 'next/server';
import { getFulfillmentData } from '@/lib/db-queries';

export async function GET() {
  try {
    const data = await getFulfillmentData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fulfillment API error:', error);
    return NextResponse.json({ error: 'Failed to fetch fulfillment data' }, { status: 500 });
  }
}
