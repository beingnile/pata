import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { canScan, incrementScanCount } from '@/lib/users'
import { authConfig } from '@/lib/auth.config'

export async function POST(request) {
  const session = await getServerSession(authConfig)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const check = await canScan(session.user.email)
    if (!check.allowed) {
      return NextResponse.json(
        { error: 'Scan limit reached. Subscribe to continue.', reason: check.reason },
        { status: 403 }
      )
    }

    const newCount = await incrementScanCount(session.user.email)
    return NextResponse.json({
      success: true,
      scanCount: newCount,
      remainingFree: Math.max(0, 3 - newCount),
    })
  } catch (err) {
    console.error('Scan increment error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
