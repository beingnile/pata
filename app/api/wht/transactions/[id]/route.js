import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { updateTransaction, deleteTransaction } from '@/lib/wht'
import { authConfig } from '@/lib/auth.config'

export async function PUT(request, { params }) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const transaction = await updateTransaction(session.user.email, id, body)
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, transaction })
  } catch (err) {
    console.error('WHT update transaction error:', err)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await deleteTransaction(session.user.email, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('WHT delete transaction error:', err)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
