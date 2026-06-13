'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  compareRegimes,
  calculateWithholdingTax,
  vatStatus,
  WHT_RATES,
  formatKsh,
  TOT_MIN_TURNOVER,
  TOT_MAX_TURNOVER,
} from '@/lib/freelancer-tax'

export default function FreelancerTaxPage() {
  const [turnover, setTurnover] = useState('')
  const [expenses, setExpenses] = useState('')
  const [whtAmount, setWhtAmount] = useState('')
  const [whtType, setWhtType] = useState('professional')

  const comparison = useMemo(() => {
    const t = Number(turnover)
    const e = Number(expenses)
    if (Number.isNaN(t) || t <= 0) return null
    return compareRegimes(t, e)
  }, [turnover, expenses])

  const vat = useMemo(() => {
    const t = Number(turnover)
    if (Number.isNaN(t) || t <= 0) return null
    return vatStatus(t)
  }, [turnover])

  const wht = useMemo(() => {
    const amount = Number(whtAmount)
    if (Number.isNaN(amount) || amount <= 0) return null
    return calculateWithholdingTax(amount, WHT_RATES[whtType])
  }, [whtAmount, whtType])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/tools"
          className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white transition-colors"
        >
          &larr; Back to tools
        </Link>

        <h1 className="font-mono text-4xl md:text-5xl font-bold mb-2">Freelancer Tax Guide</h1>
        <p className="font-mono text-lg text-gray-600 mb-8">
          Kenyan tax laws explained simply. Estimate what you owe, compare tax regimes, and know
          what to file.
        </p>

        <div className="space-y-12">
          <section className="border-2 border-black p-6">
            <h2 className="font-mono text-2xl font-bold mb-4">1. Do freelancers pay tax in Kenya?</h2>
            <p className="font-mono text-sm text-gray-700 mb-4">
              Yes. If you earn income — whether from Kenyan clients, Upwork, Fiverr, remote work, or
              local contracts — KRA expects you to register for a PIN, keep records, and file
              returns. Income includes M-Pesa, bank transfers, PayPal, Payoneer, and cash.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoBox title="Get a KRA PIN" detail="Register free on itax.kra.go.ke. You need your ID, email, and phone." />
              <InfoBox title="Keep records" detail="Track all income and business expenses: internet, rent, equipment, software." />
              <InfoBox title="File by June 30" detail="Individual tax returns are due yearly. Late filing starts at KSH 20,000." />
            </div>
          </section>

          <section className="border-2 border-black p-6">
            <h2 className="font-mono text-2xl font-bold mb-4">2. Which tax regime should you use?</h2>
            <p className="font-mono text-sm text-gray-700 mb-6">
              Freelancers usually choose between Turnover Tax (TOT) — a simple percentage of gross
              income — or Standard Income Tax, where you deduct expenses and pay progressive rates.
              TOT is only available if your annual turnover is between{' '}
              {formatKsh(TOT_MIN_TURNOVER)} and {formatKsh(TOT_MAX_TURNOVER)}.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block font-mono text-xs font-bold mb-1">Annual turnover (KSH)</label>
                <input
                  type="number"
                  value={turnover}
                  onChange={(e) => setTurnover(e.target.value)}
                  placeholder="e.g. 2400000"
                  className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-red-50"
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold mb-1">Annual expenses (KSH)</label>
                <input
                  type="number"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  placeholder="e.g. 600000"
                  className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-red-50"
                />
              </div>
            </div>

            {comparison && (
              <div className="border-2 border-black overflow-hidden">
                <div className="bg-black text-white p-3 font-mono text-sm font-bold">
                  Estimated annual tax comparison
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black">
                  <div className={`p-4 ${comparison.recommended === 'standard' ? 'bg-red-50' : ''}`}>
                    <h3 className="font-mono font-bold mb-2">Standard Income Tax</h3>
                    <p className="font-mono text-sm">Taxable income: {formatKsh(comparison.standard.taxableIncome)}</p>
                    <p className="font-mono text-sm">Tax before relief: {formatKsh(comparison.standard.grossTax)}</p>
                    <p className="font-mono text-sm">Personal relief: {formatKsh(comparison.standard.personalRelief)}</p>
                    <p className="font-mono text-xl font-bold mt-2">{formatKsh(comparison.standard.netTax)}</p>
                    <p className="font-mono text-xs text-gray-600">
                      Effective rate: {comparison.standard.effectiveRate}%
                    </p>
                    {comparison.recommended === 'standard' && (
                      <p className="font-mono text-xs text-red-600 font-bold mt-2">Recommended</p>
                    )}
                  </div>

                  <div className={`p-4 ${comparison.recommended === 'tot' ? 'bg-red-50' : ''}`}>
                    <h3 className="font-mono font-bold mb-2">Turnover Tax (TOT)</h3>
                    {!comparison.tot.eligible ? (
                      <p className="font-mono text-sm text-gray-600">
                        Not eligible. TOT is for turnover between {formatKsh(TOT_MIN_TURNOVER)} and{' '}
                        {formatKsh(TOT_MAX_TURNOVER)}.
                      </p>
                    ) : (
                      <>
                        <p className="font-mono text-sm">Rate: 3% of gross turnover</p>
                        <p className="font-mono text-sm">Turnover: {formatKsh(Number(turnover))}</p>
                        <p className="font-mono text-xl font-bold mt-2">
                          {formatKsh(comparison.tot.netTax)}
                        </p>
                        <p className="font-mono text-xs text-gray-600">
                          Effective rate: {comparison.tot.effectiveRate}%
                        </p>
                        {comparison.recommended === 'tot' && (
                          <p className="font-mono text-xs text-red-600 font-bold mt-2">Recommended</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {comparison.recommended !== 'standard' && comparison.tot.eligible && (
                  <div className="p-3 bg-gray-100 font-mono text-xs border-t-2 border-black">
                    Switching to TOT could save you approximately {formatKsh(comparison.savings)} per
                    year.
                  </div>
                )}
              </div>
            )}

            <p className="font-mono text-xs text-gray-500 mt-3">
              This is an estimate. TOT does not allow expense deductions, and some income types
              (rent, management fees, WHT-final income) are excluded. Confirm current rates on{' '}
              <a
                href="https://www.kra.go.ke"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-red-600"
              >
                kra.go.ke
              </a>
              .
            </p>
          </section>

          <section className="border-2 border-black p-6">
            <h2 className="font-mono text-2xl font-bold mb-4">3. Withholding tax calculator</h2>
            <p className="font-mono text-sm text-gray-700 mb-4">
              Kenyan companies and some individuals must deduct withholding tax before paying you.
              For resident freelancers, professional fees are usually 5%. This is normally an
              advance payment you can offset when filing your annual return.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-mono text-xs font-bold mb-1">Invoice amount (KSH)</label>
                <input
                  type="number"
                  value={whtAmount}
                  onChange={(e) => setWhtAmount(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-red-50"
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold mb-1">Payment type</label>
                <select
                  value={whtType}
                  onChange={(e) => setWhtType(e.target.value)}
                  className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-red-50 bg-white"
                >
                  <option value="professional">Professional / consultancy (5%)</option>
                  <option value="contractual">Contractual services (3%)</option>
                  <option value="training">Training / digital services (5%)</option>
                  <option value="interest">Interest income (15%)</option>
                  <option value="dividends">Dividends (5%)</option>
                  <option value="rent">Rent / leasing (10%)</option>
                </select>
              </div>
            </div>

            {wht && (
              <div className="border-2 border-black p-4 bg-gray-50 font-mono text-sm">
                <p>Gross invoice: {formatKsh(wht.gross)}</p>
                <p>Withholding tax ({(wht.rate * 100).toFixed(0)}%): {formatKsh(wht.tax)}</p>
                <p className="text-lg font-bold mt-1">You receive: {formatKsh(wht.net)}</p>
              </div>
            )}
          </section>

          <section className="border-2 border-black p-6">
            <h2 className="font-mono text-2xl font-bold mb-4">4. Do you need to register for VAT?</h2>
            <p className="font-mono text-sm text-gray-700 mb-4">
              You must register for VAT if your annual taxable turnover is {formatKsh(5000000)} or
              more. Once registered, you charge 16% VAT and file monthly returns.
            </p>

            {vat && (
              <div
                className={`border-2 border-black p-4 font-mono text-sm ${
                  vat.required ? 'bg-red-50' : 'bg-gray-50'
                }`}
              >
                {vat.required ? (
                  <p className="font-bold text-red-600">
                    Yes — VAT registration is required at this turnover level.
                  </p>
                ) : (
                  <p>
                    Not yet required. You are {formatKsh(vat.remainingToThreshold)} away from the
                    VAT threshold.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="border-2 border-black p-6">
            <h2 className="font-mono text-2xl font-bold mb-4">5. Filing checklist</h2>
            <ul className="space-y-3 font-mono text-sm">
              <CheckItem>Register for a KRA PIN on itax.kra.go.ke</CheckItem>
              <CheckItem>Track all income and expenses monthly</CheckItem>
              <CheckItem>Collect withholding tax certificates from clients</CheckItem>
              <CheckItem>File annual individual income tax return by 30 June</CheckItem>
              <CheckItem>Pay any balance due via KRA PayBill 572572 or bank</CheckItem>
              <CheckItem>Register for VAT if turnover hits {formatKsh(5000000)}</CheckItem>
              <CheckItem>File VAT returns monthly by the 20th once registered</CheckItem>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

function InfoBox({ title, detail }) {
  return (
    <div className="border border-gray-300 p-4">
      <h3 className="font-mono font-bold text-sm mb-1">{title}</h3>
      <p className="font-mono text-xs text-gray-600">{detail}</p>
    </div>
  )
}

function CheckItem({ children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-black text-xs font-bold shrink-0 mt-0.5">
        ✓
      </span>
      <span>{children}</span>
    </li>
  )
}
