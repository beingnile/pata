import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PROTECTED_PATHS = ['/tools/receipts', '/account', '/api/subscription', '/api/scans']

function addSecurityHeaders(response, request) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  if (request.nextUrl.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin')
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token')
    }
  }
}

function isProtected(pathname) {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path))
}

export async function proxy(request) {
  const pathname = request.nextUrl.pathname

  // Add security headers to every response.
  const response = NextResponse.next()
  addSecurityHeaders(response, request)

  // Enforce auth on protected routes.
  if (isProtected(pathname)) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
