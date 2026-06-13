import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getMonthlySummary } from '@/lib/wht'
import { authConfig } from '@/lib/auth.config'

export async function GET(request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()
    const summary = await getMonthlySummary(session.user.email, year)
    return NextResponse.json({ success: true, summary })
  } catch (err) {
    console.error('WHT summary error:', err)
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
