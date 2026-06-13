import { NextResponse } from 'next/server';
import { updatePayment, getPayment } from '@/lib/payments';
import { extendSubscription } from '@/lib/users';

/**
 * Daraja STK Push callback endpoint
 * Must be publicly accessible over HTTPS
 * Always return HTTP 200 so Safaricom does not retry
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      console.warn('Invalid callback body received');
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    if (ResultCode === 0) {
      // Successful payment
      const items = CallbackMetadata?.Item || [];
      const getValue = (name) =>
        items.find((i) => i.Name === name)?.Value ?? null;

      const receipt = getValue('MpesaReceiptNumber');
      const amount = getValue('Amount');
      const phone = getValue('PhoneNumber');
      const transactionDate = getValue('TransactionDate');

      console.log('Payment success:', {
        CheckoutRequestID,
        receipt,
        amount,
        phone,
      });

      updatePayment(CheckoutRequestID, {
        status: 'completed',
        receipt,
        amount,
        phone,
        transactionDate,
        completedAt: new Date().toISOString(),
      });

      // If this was a subscription payment, extend the user's subscription.
      try {
        const paymentRecord = await getPayment(CheckoutRequestID);
        if (paymentRecord?.accountReference === 'PataMonthly' && paymentRecord?.userEmail) {
          await extendSubscription(paymentRecord.userEmail, 30, 'monthly');
        }
      } catch (subErr) {
        console.error('Failed to extend subscription:', subErr);
      }
    } else {
      // Failed payment
      console.log('Payment failed:', {
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
      });

      updatePayment(CheckoutRequestID, {
        status: 'failed',
        failureReason: ResultDesc,
        failedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Callback processing error:', err);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
