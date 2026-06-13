import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getPayees, createPayee } from '@/lib/wht'
import { authConfig } from '@/lib/auth.config'

export async function GET() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payees = await getPayees(session.user.email)
    return NextResponse.json({ success: true, payees })
  } catch (err) {
    console.error('WHT payees error:', err)
    return NextResponse.json({ error: 'Failed to load payees' }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payee = await createPayee(session.user.email, body)
    return NextResponse.json({ success: true, payee })
  } catch (err) {
    console.error('WHT create payee error:', err)
    return NextResponse.json({ error: 'Failed to create payee' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
