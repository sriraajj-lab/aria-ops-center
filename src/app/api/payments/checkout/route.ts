import { NextRequest, NextResponse } from 'next/server';
import { createPayment } from '@/lib/db-queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealId, amount } = body;

    if (!dealId || !amount) {
      return NextResponse.json({ error: 'dealId and amount are required' }, { status: 400 });
    }

    const payment = await createPayment({
      dealId,
      amount,
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({
      paymentId: payment.id,
      orderId: `order_${Date.now()}`,
      amount,
      currency: 'USD',
      status: 'created',
    }, { status: 201 });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
