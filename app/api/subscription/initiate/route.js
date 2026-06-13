import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { initStkPush } from '@/lib/daraja'
import { recordPayment } from '@/lib/payments'
import { rateLimit, getClientIp, sanitizePhone } from '@/lib/security'
import { authConfig } from '@/lib/auth.config'

const SUBSCRIPTION_PRICE = 500

export async function POST(request) {
  const session = await getServerSession(authConfig)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const limit = rateLimit(ip, 'subscription', 5)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a few minutes.' },
      { status: 429, headers: { 'X-RateLimit-Reset': String(limit.resetAt) } }
    )
  }

  try {
    const body = await request.json()
    const phoneCheck = sanitizePhone(body.phone)

    if (!phoneCheck.valid) {
      return NextResponse.json({ error: phoneCheck.error }, { status: 400 })
    }

    const appUrl = process.env.APP_URL
    if (!appUrl) {
      return NextResponse.json(
        { error: 'Server configuration error. No APP_URL set.' },
        { status: 500 }
      )
    }

    const callbackUrl = `${appUrl}/api/payment/callback`

    const result = await initStkPush({
      phone: phoneCheck.formatted,
      amount: SUBSCRIPTION_PRICE,
      accountReference: 'PataMonthly',
      transactionDesc: `Pata Monthly KSH ${SUBSCRIPTION_PRICE}`,
      callbackUrl,
    })

    recordPayment(result.CheckoutRequestID, {
      status: 'pending',
      phone: phoneCheck.formatted,
      amount: SUBSCRIPTION_PRICE,
      merchantRequestId: result.MerchantRequestID,
      accountReference: 'PataMonthly',
      userEmail: session.user.email,
    })

    return NextResponse.json({
      success: true,
      checkoutRequestID: result.CheckoutRequestID,
      merchantRequestID: result.MerchantRequestID,
    })
  } catch (err) {
    console.error('Subscription initiation error:', err)
    return NextResponse.json(
      { error: err.message || 'Payment initiation failed. Please try again.' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
