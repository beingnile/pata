import { NextResponse } from 'next/server';
import { initStkPush } from '@/lib/daraja';
import { recordPayment } from '@/lib/payments';
import { rateLimit, getClientIp, sanitizePhone, schemas } from '@/lib/security';

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = rateLimit(ip, 'payment', 5); // 5 payment attempts per minute

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many payment attempts. Please wait a few minutes.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = schemas.paymentInit.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payment details.' },
        { status: 400 }
      );
    }

    const { phone: rawPhone, amount } = parsed.data;
    const phoneCheck = sanitizePhone(rawPhone);

    if (!phoneCheck.valid) {
      return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
    }

    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: 'Server configuration error. No APP_URL set.' },
        { status: 500 }
      );
    }

    const callbackUrl = `${appUrl}/api/payment/callback`;

    const result = await initStkPush({
      phone: phoneCheck.formatted,
      amount,
      accountReference: 'PataOptimize',
      transactionDesc: `Pata Payslip Optimization KSH ${amount}`,
      callbackUrl,
    });

    // Record pending payment
    recordPayment(result.CheckoutRequestID, {
      status: 'pending',
      phone: phoneCheck.formatted,
      amount,
      merchantRequestId: result.MerchantRequestID,
    });

    return NextResponse.json({
      success: true,
      checkoutRequestID: result.CheckoutRequestID,
      merchantRequestID: result.MerchantRequestID,
    });
  } catch (err) {
    console.error('STK push error:', err);
    return NextResponse.json(
      { error: err.message || 'Payment initiation failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
