'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  compressImage,
  recognizeReceipt,
  parseReceiptText,
  downloadReceiptsZip,
  pdfToImages,
} from '@/lib/receipts'

const FREE_SCAN_LIMIT = 3
const SUBSCRIPTION_PRICE = 500

function formatKsh(amount) {
  if (!amount || Number.isNaN(amount)) return 'KSH 0'
  return `KSH ${Number(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatCurrency(amount, currency = 'KSH') {
  if (!amount || Number.isNaN(amount)) return `${currency} 0.00`
  const symbol = currency === 'USD' || currency === '$' ? '$' : `${currency} `
  return `${symbol}${Number(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function ReceiptVaultPage() {
  const { data: session, status: sessionStatus } = useSession()

  const [receipts, setReceipts] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')

  const [scanCount, setScanCount] = useState(0)
  const [subscription, setSubscription] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  // Payment state
  const [phone, setPhone] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState('')
  const [checkoutId, setCheckoutId] = useState('')
  const [payStatus, setPayStatus] = useState('idle')

  const userEmail = session?.user?.email

  const fetchUserStatus = useCallback(async () => {
    if (!userEmail) return
    setLoadingStatus(true)
    try {
      const [subRes, scanRes] = await Promise.all([
        fetch('/api/subscription/status'),
        fetch('/api/scans/status'),
      ])

      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscription(subData.subscription)
      }
      if (scanRes.ok) {
        const scanData = await scanRes.json()
        setScanCount(scanData.scanCount)
      }
    } catch (err) {
      console.error('Failed to load user status:', err)
    } finally {
      setLoadingStatus(false)
    }
  }, [userEmail])

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchUserStatus()
    } else if (sessionStatus === 'unauthenticated') {
      setLoadingStatus(false)
    }
  }, [sessionStatus, fetchUserStatus])

  useEffect(() => {
    if (!checkoutId || payStatus !== 'pending') return

    const timeout = setTimeout(() => {
      setPayStatus('idle')
      setPayError('The M-Pesa prompt expired. Enter your number and try again.')
      setCheckoutId('')
    }, 65000)

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?checkoutRequestID=${checkoutId}`)
        const data = await res.json()
        if (!res.ok) return

        if (data.status === 'completed') {
          setPayStatus('success')
          await fetchUserStatus()
          clearInterval(interval)
          clearTimeout(timeout)
        } else if (data.status === 'failed') {
          setPayStatus('idle')
          setPayError('Payment was cancelled or declined. You can try again.')
          setCheckoutId('')
          clearInterval(interval)
          clearTimeout(timeout)
        }
      } catch {
        // ignore network blips, keep polling
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [checkoutId, payStatus, fetchUserStatus])

  const remainingFree = Math.max(0, FREE_SCAN_LIMIT - scanCount)
  const subscribed = subscription?.active === true
  const canScanNow = subscribed || remainingFree > 0

  const processFiles = useCallback(
    async (files) => {
      if (!canScanNow) return

      const allSources = []

      for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
          setStatusText('Converting PDF to images...')
          try {
            const images = await pdfToImages(file)
            images.forEach((blob, idx) => {
              allSources.push({ blob, name: `${file.name.replace(/\.pdf$/i, '')}-page-${idx + 1}.jpg` })
            })
          } catch (err) {
            console.error('PDF conversion failed:', err)
            setStatusText('Failed to read PDF. Try an image instead.')
            setIsProcessing(false)
            return
          }
        } else if (file.type.startsWith('image/')) {
          allSources.push({ blob: file, name: file.name })
        }
      }

      if (allSources.length === 0) return

      setIsProcessing(true)
      setStatusText('Compressing images...')

      for (const source of allSources) {
        if (!subscribed && scanCount >= FREE_SCAN_LIMIT) break

        const id = generateId()
        try {
          const compressedBlob = await compressImage(source.blob)
          const imageUrl = URL.createObjectURL(compressedBlob)
          const imageName = `receipt-${id}.jpg`

          setReceipts((prev) => [
            ...prev,
            {
              id,
              fileName: source.name,
              imageName,
              imageUrl,
              imageBlob: compressedBlob,
              status: 'scanning',
              confidence: 0,
              merchant: '',
              date: '',
              time: '',
              receiptNo: '',
              invoiceNo: '',
              kraPin: '',
              currency: 'KSH',
              total: 0,
              tax: 0,
              rawText: '',
            },
          ])

          const { text, confidence } = await recognizeReceipt(imageUrl, setStatusText)
          const parsed = parseReceiptText(text)

          setReceipts((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status: 'done',
                    confidence,
                    ...parsed,
                  }
                : r
            )
          )

          // Increment scan count on the server after a successful OCR.
          const incRes = await fetch('/api/scans/increment', { method: 'POST' })
          if (incRes.ok) {
            const incData = await incRes.json()
            setScanCount(incData.scanCount)
          }
        } catch (err) {
          setReceipts((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: 'error', error: err.message } : r))
          )
        }
      }

      setIsProcessing(false)
      setStatusText('')
    },
    [canScanNow, subscribed, scanCount]
  )

  const handleFileChange = useCallback(
    (e) => {
      if (e.target.files?.length) {
        processFiles(e.target.files)
        e.target.value = ''
      }
    },
    [processFiles]
  )

  const handlePay = async (e) => {
    e.preventDefault()
    setPayError('')
    setPayLoading(true)

    try {
      const res = await fetch('/api/subscription/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment failed')

      setCheckoutId(data.checkoutRequestID)
      setPayStatus('pending')
    } catch (err) {
      setPayError(err.message)
      setPayStatus('idle')
    } finally {
      setPayLoading(false)
    }
  }

  const updateReceipt = useCallback((id, field, value) => {
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }, [])

  const removeReceipt = useCallback((id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const handleDownload = useCallback(async () => {
    setStatusText('Building archive...')
    await downloadReceiptsZip(receipts)
    setStatusText('')
  }, [receipts])

  const totals = useMemo(() => {
    return receipts.reduce(
      (acc, r) => {
        acc.total += Number(r.total) || 0
        acc.tax += Number(r.tax) || 0
        return acc
      },
      { total: 0, tax: 0 }
    )
  }, [receipts])

  const doneCount = receipts.filter((r) => r.status === 'done').length

  if (sessionStatus === 'loading' || loadingStatus) {
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
          <Link
            href="/"
            className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white transition-colors"
          >
            &larr; Back home
          </Link>
          <h1 className="font-mono text-3xl md:text-4xl font-bold mb-2">Receipt Vault</h1>
          <p className="font-mono text-gray-600 mb-8">
            Sign in to scan receipts, track expenses, and download your archive.
          </p>
          <div className="space-y-4">
            <Link
              href="/login?callbackUrl=/tools/receipts"
              className="block w-full bg-black text-white font-mono text-sm px-6 py-3 border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors uppercase"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="block w-full bg-white text-black font-mono text-sm px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors uppercase"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <Link
            href="/"
            className="font-mono underline decoration-red-600 inline-block hover:bg-red-600 hover:text-white transition-colors"
          >
            &larr; Back home
          </Link>
          <div className="flex items-center gap-4 font-mono text-sm">
            <span className="text-gray-600 truncate max-w-[200px]">{userEmail}</span>
            <Link href="/account" className="underline hover:text-red-600">
              Account
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="underline hover:text-red-600"
            >
              Sign out
            </button>
          </div>
        </div>

        <h1 className="font-mono text-4xl md:text-5xl font-bold mb-2">Receipt Vault</h1>
        <p className="font-mono text-lg text-gray-600 mb-8">
          Snap, upload, or drop a PDF. We read the totals, dates, and tax details, then pack
          everything into a tidy ZIP you can keep for your records.
        </p>

        <div className="border-2 border-black p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="font-mono font-bold">Your plan</h2>
              {subscribed ? (
                <p className="font-mono text-sm text-green-700">
                  Monthly unlimited active until {formatDate(subscription.expiresAt)}
                </p>
              ) : (
                <p className="font-mono text-sm text-gray-600">
                  Free tier — {remainingFree} scan{remainingFree !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
            {!subscribed && (
              <button
                onClick={() => document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-red-600 text-white font-mono text-xs px-4 py-2 border-2 border-red-600 hover:bg-black hover:border-black transition-colors uppercase"
              >
                Upgrade for KSH {SUBSCRIPTION_PRICE}/mo
              </button>
            )}
          </div>

          <label className="block font-mono text-sm font-bold mb-2">Add receipt photos or PDFs</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            multiple
            onChange={handleFileChange}
            disabled={isProcessing || !canScanNow}
            className="w-full border-2 border-black p-4 font-mono text-sm file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:bg-black file:text-white file:font-mono hover:file:bg-red-600 hover:file:border-red-600 disabled:opacity-50"
          />
          <p className="font-mono text-xs text-gray-500 mt-3">
            Supports JPG, PNG, and PDF. Files are processed in your browser — nothing is uploaded.
          </p>

          {statusText && (
            <div className="mt-4 flex items-center gap-3 font-mono text-sm">
              <span className="inline-block w-4 h-4 border-2 border-black border-t-red-600 animate-spin rounded-full" />
              {statusText}
            </div>
          )}
        </div>

        {!canScanNow && (
          <div id="subscribe" className="border-2 border-red-600 p-6 mb-8 bg-red-50">
            <h2 className="font-mono text-xl font-bold text-red-600 mb-2">
              Upgrade to unlimited scans
            </h2>
            <p className="font-mono text-sm text-gray-700 mb-4">
              You have used your {FREE_SCAN_LIMIT} free scans. Subscribe for KSH {SUBSCRIPTION_PRICE}{' '}
              per month to scan and archive unlimited receipts.
            </p>

            {payStatus === 'success' ? (
              <p className="font-mono text-green-700 font-bold">
                Payment received. Your subscription is now active.
              </p>
            ) : (
              <form onSubmit={handlePay} className="space-y-4 max-w-md">
                <div>
                  <label className="block font-mono text-xs font-bold mb-1">M-Pesa Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={payLoading || payStatus === 'pending'}
                  className="w-full bg-red-600 text-white font-mono text-sm px-6 py-3 border-2 border-red-600 hover:bg-black hover:border-black transition-colors disabled:opacity-50 uppercase"
                >
                  {payStatus === 'pending'
                    ? 'Check your phone...'
                    : payLoading
                      ? 'Processing...'
                      : `Subscribe for KSH ${SUBSCRIPTION_PRICE}`}
                </button>
                {payError && <p className="font-mono text-red-600 text-xs">{payError}</p>}
              </form>
            )}
          </div>
        )}

        {receipts.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-mono text-sm">
                <span className="font-bold">{receipts.length}</span> receipt
                {receipts.length !== 1 ? 's' : ''} added
                {doneCount > 0 && <span className="text-gray-600"> · {doneCount} scanned</span>}
              </p>
              <p className="font-mono text-sm text-gray-600">
                Total: {formatCurrency(totals.total)} · Tax: {formatCurrency(totals.tax)}
              </p>
            </div>
            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="bg-red-600 text-white font-mono text-sm px-6 py-3 border-2 border-red-600 hover:bg-black hover:border-black transition-colors disabled:opacity-50 uppercase"
            >
              Download archive
            </button>
          </div>
        )}

        <div className="space-y-6">
          {receipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onUpdate={updateReceipt}
              onRemove={removeReceipt}
            />
          ))}
        </div>

        {receipts.length === 0 && !isProcessing && (
          <div className="border-2 border-dashed border-gray-400 p-12 text-center">
            <p className="font-mono text-gray-500">No receipts yet. Upload one to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ReceiptCard({ receipt, onUpdate, onRemove }) {
  const isScanning = receipt.status === 'scanning'
  const hasError = receipt.status === 'error'

  return (
    <div className="border-2 border-black overflow-hidden">
      <div className="bg-black text-white p-3 flex items-center justify-between">
        <span className="font-mono text-sm truncate max-w-[70%]">
          {receipt.fileName || 'Receipt'}
        </span>
        <div className="flex items-center gap-3">
          {receipt.confidence > 0 && (
            <span className="font-mono text-xs text-gray-300">
              OCR: {Math.round(receipt.confidence)}%
            </span>
          )}
          <button
            onClick={() => onRemove(receipt.id)}
            className="font-mono text-xs underline hover:text-red-400"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1 border-b-2 md:border-b-0 md:border-r-2 border-black bg-gray-50">
          {receipt.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={receipt.imageUrl}
              alt="Receipt preview"
              className="w-full h-48 md:h-full object-cover"
            />
          ) : (
            <div className="w-full h-48 md:h-full flex items-center justify-center font-mono text-xs text-gray-500">
              No preview
            </div>
          )}
        </div>

        <div className="md:col-span-2 p-4 space-y-4">
          {isScanning && (
            <div className="flex items-center gap-3 font-mono text-sm text-red-600">
              <span className="inline-block w-4 h-4 border-2 border-red-600 border-t-black animate-spin rounded-full" />
              Reading receipt...
            </div>
          )}

          {hasError && <p className="font-mono text-sm text-red-600">Error: {receipt.error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Merchant"
              value={receipt.merchant}
              onChange={(v) => onUpdate(receipt.id, 'merchant', v)}
              placeholder="e.g. Naivas Supermarket"
            />
            <Field
              label="Invoice No"
              value={receipt.invoiceNo}
              onChange={(v) => onUpdate(receipt.id, 'invoiceNo', v)}
              placeholder="e.g. F6MV8RKX-0001"
            />
            <Field
              label="Receipt No"
              value={receipt.receiptNo}
              onChange={(v) => onUpdate(receipt.id, 'receiptNo', v)}
              placeholder="e.g. 2789-1763"
            />
            <Field
              label="Date"
              value={receipt.date}
              onChange={(v) => onUpdate(receipt.id, 'date', v)}
              placeholder="e.g. May 21, 2026"
            />
            <Field
              label="Time"
              value={receipt.time}
              onChange={(v) => onUpdate(receipt.id, 'time', v)}
              placeholder="e.g. 14:30"
            />
            <Field
              label="Currency"
              value={receipt.currency}
              onChange={(v) => onUpdate(receipt.id, 'currency', v)}
              placeholder="e.g. USD"
            />
            <Field
              label="KRA PIN"
              value={receipt.kraPin}
              onChange={(v) => onUpdate(receipt.id, 'kraPin', v)}
              placeholder="e.g. P000111222A"
            />
            <Field
              label="Total"
              type="number"
              value={receipt.total}
              onChange={(v) => onUpdate(receipt.id, 'total', Number(v))}
              placeholder="0.00"
            />
            <Field
              label="Tax / VAT"
              type="number"
              value={receipt.tax}
              onChange={(v) => onUpdate(receipt.id, 'tax', Number(v))}
              placeholder="0.00"
            />
          </div>

          {receipt.rawText && (
            <details className="font-mono text-xs">
              <summary className="cursor-pointer hover:text-red-600">View raw OCR text</summary>
              <pre className="mt-2 p-3 bg-gray-100 overflow-auto max-h-40 whitespace-pre-wrap border border-gray-300">
                {receipt.rawText}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block font-mono text-xs font-bold mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-2 border-black p-2 font-mono text-sm focus:outline-none focus:bg-red-50"
      />
    </div>
  )
}
