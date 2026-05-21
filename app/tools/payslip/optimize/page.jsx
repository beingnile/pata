'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

function formatKsh(amount) {
  return `KSH ${Math.round(amount).toLocaleString('en-KE')}`
}

export default function OptimizePage() {
  const [gross, setGross] = useState('')
  const [result, setResult] = useState(null)
  const [paid, setPaid] = useState(false)

  const [phone, setPhone] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState('')
  const [checkoutId, setCheckoutId] = useState('')
  const [payStatus, setPayStatus] = useState('idle')

  useEffect(() => {
    if (!checkoutId || payStatus !== 'pending') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?checkoutRequestID=${checkoutId}`)
        const data = await res.json()
        if (!res.ok) return

        if (data.status === 'completed') {
          setPayStatus('success')
          setPaid(true)
          clearInterval(interval)
        } else if (data.status === 'failed') {
          setPayStatus('failed')
          clearInterval(interval)
        }
      } catch {
        // ignore
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [checkoutId, payStatus])

  const handleAnalyze = useCallback(async () => {
    setResult(null)
    setPayError('')
    const value = Number(gross)
    if (Number.isNaN(value) || value <= 0) return

    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grossSalary: value }),
      })
      const data = await res.json()
      if (res.ok) setResult(data.data)
    } catch {
      // ignore
    }
  }, [gross])

  const handlePay = async (e) => {
    e.preventDefault()
    setPayError('')
    setPayLoading(true)

    try {
      const res = await fetch('/api/payment/stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount: 350 }),
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/tools/payslip"
          className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white transition-colors"
        >
          &larr; Back to Calculator
        </Link>

        <h1 className="font-mono text-4xl md:text-5xl font-bold mb-2">Tax Optimizer</h1>
        <p className="font-mono text-lg text-gray-600 mb-8">
          Let us run the numbers on a few things you could be doing differently.
        </p>

        <div className="border-2 border-black p-6 mb-8">
          <label className="block font-mono text-sm font-bold mb-2">Your Gross Salary (KSH)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              placeholder="e.g. 80000"
              className="flex-1 border-2 border-black p-4 font-mono text-lg focus:outline-none focus:bg-red-50"
              min="0"
            />
            <button
              onClick={handleAnalyze}
              className="bg-black text-white font-mono px-6 py-4 border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors"
            >
              Analyze
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-8 mb-12">
            <div className="border-2 border-black p-4 md:p-6 bg-gray-50">
              <h2 className="font-mono text-lg md:text-xl font-bold mb-4">Where You Stand Now</h2>
              <div className="grid grid-cols-2 gap-3 md:gap-4 font-mono text-xs md:text-sm">
                <div>
                  <span className="text-gray-500">Gross</span>
                  <p className="font-bold text-base md:text-lg">{formatKsh(result.grossSalary)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Net Pay</span>
                  <p className="font-bold text-base md:text-lg">{formatKsh(result.netSalary)}</p>
                </div>
                <div>
                  <span className="text-gray-500">PAYE</span>
                  <p>{formatKsh(result.deductions.paye.net)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Keep Rate</span>
                  <p>{result.keepRate}%</p>
                </div>
              </div>
            </div>

            {!paid ? (
              <div className="border-2 border-red-600 p-4 md:p-6">
                <h3 className="font-mono text-base md:text-lg font-bold text-red-600 mb-2">
                  Want to see what is possible?
                </h3>
                <p className="font-mono text-xs md:text-sm mb-2 text-gray-700">
                  One-time unlock without subscription.
                </p>
                <p className="font-mono text-xs md:text-sm mb-4 text-gray-700">
                  We will model four real scenarios for your salary:
                </p>
                <ul className="font-mono text-xs md:text-sm space-y-2 mb-6 list-disc list-inside text-gray-700">
                  <li>Bumping your pension to the KSH 20,000/month cap</li>
                  <li>Getting private insurance and claiming the relief</li>
                  <li>Deducting mortgage interest on your primary residence</li>
                  <li>Stacking pension + insurance + HOSP together</li>
                </ul>

                {payStatus !== 'success' && (
                  <form onSubmit={handlePay} className="space-y-4">
                    <div>
                      <label className="block font-mono text-xs md:text-sm font-bold mb-1">
                        M-Pesa Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07XX XXX XXX"
                        className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-red-50"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={payLoading || payStatus === 'pending'}
                      className="w-full bg-red-600 text-white font-mono text-sm md:text-base px-6 md:px-8 py-3 md:py-4 border-2 border-red-600 hover:bg-black hover:border-black transition-colors disabled:opacity-50"
                    >
                      {payStatus === 'pending'
                        ? 'Check your phone...'
                        : payLoading
                          ? 'Processing...'
                          : 'Unlock for KSH 350 — one time'}
                    </button>
                    {payError && (
                      <p className="font-mono text-red-600 text-xs md:text-sm">{payError}</p>
                    )}
                    {payStatus === 'failed' && (
                      <p className="font-mono text-red-600 text-xs md:text-sm">
                        That did not work. Want to try again?
                      </p>
                    )}
                  </form>
                )}
              </div>
            ) : (
              <OptimizationResult grossSalary={result.grossSalary} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function OptimizationResult({ grossSalary }) {
  const scenarios = [
    {
      name: 'Max Your Pension',
      description: 'Contribute the full KSH 20,000/month to your pension. Your taxable income drops, your retirement fund grows.',
      pension: 20000,
      insurance: 0,
      mortgage: 0,
      hosp: 0,
    },
    {
      name: 'Get Insurance',
      description: 'Pay KSH 8,000/month for a life or health policy. 15% of that comes back as a tax credit.',
      pension: 0,
      insurance: 8000,
      mortgage: 0,
      hosp: 0,
    },
    {
      name: 'Claim Mortgage Interest',
      description: 'If you are paying off your house, up to KSH 25,000/month in interest comes off your taxable income.',
      pension: 0,
      insurance: 0,
      mortgage: 25000,
      hosp: 0,
    },
    {
      name: 'Do All Three',
      description: 'Pension KSH 15,000 + insurance KSH 5,000 + HOSP KSH 8,000. The power move.',
      pension: 15000,
      insurance: 5000,
      mortgage: 0,
      hosp: 8000,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border-2 border-green-600 p-4">
        <p className="font-mono text-green-800 font-bold">
          Paid. Here is what your tax bill could look like.
        </p>
      </div>

      <h3 className="font-mono text-2xl font-bold">Four Ways to Pay Less</h3>

      <div className="grid gap-4">
        {scenarios.map((s, i) => {
          const oldPaye = simulatePaye(grossSalary, 0, 0, 0, 0)
          const newResult = simulatePaye(
            grossSalary,
            s.pension,
            s.insurance,
            s.mortgage,
            s.hosp
          )
          const saving = oldPaye - newResult
          const yearlySaving = saving * 12

          return (
            <div key={i} className="border-2 border-black p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-mono font-bold">{s.name}</h4>
                {saving > 0 && (
                  <span className="font-mono text-xs bg-red-600 text-white px-2 py-1 whitespace-nowrap">
                    Save {formatKsh(saving)}/mo
                  </span>
                )}
              </div>
              <p className="font-mono text-sm text-gray-600 mb-3">{s.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs md:text-sm">
                <div>
                  <span className="text-gray-500">Current PAYE</span>
                  <p>{formatKsh(oldPaye)}</p>
                </div>
                <div>
                  <span className="text-gray-500">New PAYE</span>
                  <p className="text-green-700 font-bold">{formatKsh(newResult)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Yearly</span>
                  <p className="text-green-700 font-bold">{formatKsh(yearlySaving)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-2 border-black p-4 bg-gray-50">
        <h4 className="font-mono font-bold mb-2">What to actually do</h4>
        <ol className="font-mono text-sm list-decimal list-inside space-y-1 text-gray-700">
          <li>Talk to HR about bumping your pension contribution.</li>
          <li>Get insurance from a Kenyan provider and give them your KRA PIN.</li>
          <li>Keep all mortgage interest statements for your June 30 filing.</li>
          <li>Open an HOSP at KCB, Co-op, or Equity if you are saving for your first home.</li>
          <li>File your iTax return by June 30 and declare everything.</li>
        </ol>
      </div>
    </div>
  )
}

function simulatePaye(gross, pension, insurance, mortgage, hosp) {
  const taxable = Math.max(0, gross - pension - mortgage - hosp)
  let tax = 0
  let remaining = taxable

  const brackets = [
    { max: 24000, rate: 0.1 },
    { max: 32333, rate: 0.25 },
    { max: 500000, rate: 0.3 },
    { max: 800000, rate: 0.325 },
    { max: Infinity, rate: 0.35 },
  ]

  let prev = 0
  for (const b of brackets) {
    if (remaining <= 0) break
    const size = b.max === Infinity ? remaining : b.max - prev
    const t = Math.min(remaining, size)
    tax += t * b.rate
    remaining -= t
    prev = b.max
  }

  const insuranceRelief = Math.min(insurance * 0.15, 5000)
  const personalRelief = 2400

  return Math.max(0, Math.round(tax - personalRelief - insuranceRelief))
}
