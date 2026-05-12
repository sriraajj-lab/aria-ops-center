import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('paymentId');

    if (paymentId) {
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: { deal: { include: { lead: true } } },
      });
      return NextResponse.json(payment);
    }

    const payments = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { deal: { include: { lead: { select: { name: true } } } } },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
}
