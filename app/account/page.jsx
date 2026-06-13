'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const [subscription, setSubscription] = useState(null)
  const [scanCount, setScanCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') return
    if (!session?.user?.email) return

    async function load() {
      try {
        const [subRes, scanRes] = await Promise.all([
          fetch('/api/subscription/status'),
          fetch('/api/scans/status'),
        ])
        if (subRes.ok) {
          const data = await subRes.json()
          setSubscription(data.subscription)
        }
        if (scanRes.ok) {
          const data = await scanRes.json()
          setScanCount(data.scanCount)
        }
      } catch (err) {
        console.error('Failed to load account:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [session, status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="font-mono text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <h1 className="font-mono text-3xl font-bold mb-4">Account</h1>
          <p className="font-mono text-gray-600 mb-8">Please sign in to view your account.</p>
          <Link
            href="/login?callbackUrl=/account"
            className="inline-block bg-black text-white font-mono text-sm px-6 py-3 border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors uppercase"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white transition-colors"
        >
          &larr; Back home
        </Link>

        <h1 className="font-mono text-4xl font-bold mb-2">Account</h1>
        <p className="font-mono text-gray-600 mb-8">{session.user.email}</p>

        <div className="border-2 border-black p-6 mb-6">
          <h2 className="font-mono text-xl font-bold mb-4">Subscription</h2>
          {subscription?.active ? (
            <div className="space-y-2 font-mono text-sm">
              <p>
                <span className="font-bold">Plan:</span> Monthly unlimited
              </p>
              <p>
                <span className="font-bold">Active until:</span>{' '}
                {formatDate(subscription.expiresAt)}
              </p>
              <p className="text-green-700 font-bold">Active</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-mono text-sm text-gray-700">
                You are on the free plan with {Math.max(0, 3 - scanCount)} scan
                {Math.max(0, 3 - scanCount) !== 1 ? 's' : ''} remaining.
              </p>
              <Link
                href="/tools/receipts"
                className="inline-block bg-red-600 text-white font-mono text-sm px-6 py-3 border-2 border-red-600 hover:bg-black hover:border-black transition-colors uppercase"
              >
                Upgrade for KSH 500
              </Link>
            </div>
          )}
        </div>

        <div className="border-2 border-black p-6 mb-6">
          <h2 className="font-mono text-xl font-bold mb-4">Usage</h2>
          <p className="font-mono text-sm">
            Receipts scanned: <span className="font-bold">{scanCount}</span>
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-black text-white font-mono text-sm px-6 py-3 border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors uppercase"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
