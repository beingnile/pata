import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { canScan } from '@/lib/users'
import { authConfig } from '@/lib/auth.config'

export async function GET(request) {
  const session = await getServerSession(authConfig)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await canScan(session.user.email)
    return NextResponse.json({
      success: true,
      scanCount: result.scanCount,
      allowed: result.allowed,
      reason: result.reason,
      remainingFree: Math.max(0, 3 - result.scanCount),
    })
  } catch (err) {
    console.error('Scan status error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
