'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function SearchParamsReader({ onCallbackUrl }) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/tools/receipts'
  onCallbackUrl(callbackUrl)
  return null
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('/account')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      const messages = {
        CredentialsSignin: 'Invalid email or password. Please try again.',
        invalid_credentials: 'Invalid email or password. Please try again.',
        OAuthAccountNotLinked: 'This email is linked to another sign-in method.',
      }
      setError(messages[result.error] || result.error)
      return
    }

    if (result?.url) {
      window.location.href = result.url
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={null}>
        <SearchParamsReader onCallbackUrl={setCallbackUrl} />
      </Suspense>

      <div className="max-w-md mx-auto px-6 py-16">
        <Link
          href="/"
          className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white transition-colors"
        >
          &larr; Back home
        </Link>

        <h1 className="font-mono text-3xl md:text-4xl font-bold mb-2">Sign in to PATA</h1>
        <p className="font-mono text-gray-600 mb-8">Access your tax tools, receipts, and account.</p>

        <form onSubmit={handleSubmit} className="border-2 border-black p-6 space-y-4">
          <div>
            <label className="block font-mono text-sm font-bold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-red-50"
            />
          </div>

          <div>
            <label className="block font-mono text-sm font-bold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-red-50"
            />
          </div>

          {error && <p className="font-mono text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-mono text-sm px-6 py-3 border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors disabled:opacity-50 uppercase"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {process.env.AUTH_GOOGLE_ID && (
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full mt-4 bg-white text-black font-mono text-sm px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors"
          >
            Sign in with Google
          </button>
        )}

        <p className="font-mono text-sm text-gray-600 mt-6 text-center">
          No account?{' '}
          <Link href="/signup" className="underline hover:text-red-600">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
