'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      router.push('/tools/receipts')
    } catch (err) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-16">
        <Link
          href="/"
          className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white transition-colors"
        >
          &larr; Back home
        </Link>

        <h1 className="font-mono text-3xl md:text-4xl font-bold mb-2">Create account</h1>
        <p className="font-mono text-gray-600 mb-8">Start with 3 free receipt scans.</p>

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
              minLength={6}
              className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-red-50"
            />
          </div>

          {error && <p className="font-mono text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-mono text-sm px-6 py-3 border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors disabled:opacity-50 uppercase"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="font-mono text-sm text-gray-600 mt-6 text-center">
          Already have an account?{' '}
          <Link href="/login" className="underline hover:text-red-600">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
