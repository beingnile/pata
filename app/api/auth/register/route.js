import { NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const result = await registerUser(body.email, body.password)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, email: result.user.email })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
