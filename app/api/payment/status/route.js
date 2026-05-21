import { NextResponse } from 'next/server';
import { getPayment } from '@/lib/payments';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const checkoutRequestID = searchParams.get('checkoutRequestID');

  if (!checkoutRequestID) {
    return NextResponse.json({ error: 'Missing checkoutRequestID' }, { status: 400 });
  }

  const payment = getPayment(checkoutRequestID);

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    status: payment.status,
    data: payment,
  });
}
