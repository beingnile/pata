import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getTransactions, createTransaction } from '@/lib/wht'
import { authConfig } from '@/lib/auth.config'

export async function GET() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const transactions = await getTransactions(session.user.email)
    return NextResponse.json({ success: true, transactions })
  } catch (err) {
    console.error('WHT transactions error:', err)
    return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const transaction = await createTransaction(session.user.email, body)
    return NextResponse.json({ success: true, transaction })
  } catch (err) {
    console.error('WHT create transaction error:', err)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
