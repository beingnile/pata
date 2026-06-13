import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { updatePayee, deletePayee } from '@/lib/wht'
import { authConfig } from '@/lib/auth.config'

export async function PUT(request, { params }) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const payee = await updatePayee(session.user.email, id, body)
    if (!payee) {
      return NextResponse.json({ error: 'Payee not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, payee })
  } catch (err) {
    console.error('WHT update payee error:', err)
    return NextResponse.json({ error: 'Failed to update payee' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await deletePayee(session.user.email, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('WHT delete payee error:', err)
    return NextResponse.json({ error: 'Failed to delete payee' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
