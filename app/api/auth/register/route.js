import { NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('Registration attempt:', { email: body.email, hasPassword: !!body.password })

    const result = await registerUser(body.email, body.password)

    if (!result.success) {
      console.log('Registration validation failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    console.log('Registration success:', result.user.email)
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
