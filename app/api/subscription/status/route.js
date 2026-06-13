import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getSubscription } from '@/lib/users'
import { authConfig } from '@/lib/auth.config'

export async function GET(request) {
  const session = await getServerSession(authConfig)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const subscription = await getSubscription(session.user.email)
    return NextResponse.json({ success: true, subscription })
  } catch (err) {
    console.error('Subscription status error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
