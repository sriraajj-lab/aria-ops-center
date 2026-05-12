import { NextRequest, NextResponse } from 'next/server';
import { updatePayment } from '@/lib/db-queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, payload } = body;

    switch (event) {
      case 'payment.captured': {
        const paymentId = payload?.payment?.entity?.id;
        const orderId = payload?.payment?.entity?.order_id;
        if (orderId) {
          await updatePayment(orderId, {
            status: 'completed',
            razorpayPaymentId: paymentId,
            paidAt: new Date().toISOString(),
          });
        }
        break;
      }
      case 'payment.failed': {
        const failedOrderId = payload?.payment?.entity?.order_id;
        if (failedOrderId) {
          await updatePayment(failedOrderId, { status: 'failed' });
        }
        break;
      }
      case 'refund.processed': {
        const refundPaymentId = payload?.payment?.entity?.id;
        if (refundPaymentId) {
          await updatePayment(refundPaymentId, { status: 'refunded' });
        }
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
