'use client'

import { useState } from 'react'
import Link from 'next/link'

function formatKsh(amount) {
  return `KSH ${Math.round(amount).toLocaleString('en-KE')}`
}

export default function PayslipTool() {
  const [grossSalary, setGrossSalary] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCalculate = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)

    const value = Number(grossSalary)
    if (Number.isNaN(value) || value < 0) {
      setError('That does not look right. Try a positive number.')
      return
    }
    if (value > 50_000_000) {
      setError('That is a lot of money. Too much for this calculator.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grossSalary: value }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something broke')
      setResult(data.data)
    } catch (err) {
      setError(err.message || 'Oops. Try again?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white transition-colors"
        >
          &larr; Back home
        </Link>

        <h1 className="font-mono text-4xl md:text-5xl font-bold mb-2">Tax calculator</h1>
        <p className="font-mono text-lg text-gray-600 mb-8">
          Type in what your contract says you earn. We will show you where every shilling goes.
        </p>

        <form onSubmit={handleCalculate} className="border-2 border-black p-6 mb-12">
          <label htmlFor="salary" className="block font-mono text-sm font-bold mb-2">
            Monthly Gross Salary (KSH)
          </label>
          <input
            id="salary"
            type="number"
            value={grossSalary}
            onChange={(e) => setGrossSalary(e.target.value)}
            placeholder="e.g. 50000"
            className="w-full border-2 border-black p-4 font-mono text-lg mb-4 focus:outline-none focus:bg-red-50"
            min="0"
            step="1"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-mono text-lg px-8 py-4 border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors disabled:opacity-50 uppercase"
          >
            {loading ? 'Crunching numbers...' : 'Calculate my tax'}
          </button>
          {error && (
            <p className="font-mono text-red-600 mt-4 text-sm">{error}</p>
          )}
        </form>

        {result && <PayslipBreakdown result={result} />}
      </div>
    </div>
  )
}

function PayslipBreakdown({ result }) {
  const d = result.deductions

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-in]">
      <div className="border-2 border-black p-4 md:p-6 bg-black text-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-4">
          <div>
            <p className="font-mono text-sm text-gray-400">Gross Salary</p>
            <p className="font-mono text-xl md:text-2xl font-bold">{formatKsh(result.grossSalary)}</p>
          </div>
          <div className="sm:text-right">
            <p className="font-mono text-sm text-gray-400">What You Actually Get</p>
            <p className="font-mono text-xl md:text-2xl font-bold text-red-400">
              {formatKsh(result.netSalary)}
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 flex flex-col sm:flex-row justify-between font-mono text-xs sm:text-sm gap-1">
          <span>Total Deductions: {formatKsh(result.totalDeductions)}</span>
          <span>You keep {result.keepRate}%</span>
        </div>
      </div>

      <div className="border-2 border-black">
        <div className="bg-black text-white p-4">
          <h2 className="font-mono text-lg md:text-xl font-bold">Where It All Goes</h2>
        </div>
        <div className="divide-y-2 divide-black">
          <Row label="PAYE (Income Tax)" value={d.paye.net} detail>
            <Detail label="Taxable Income" value={d.paye.taxableIncome} />
            <Detail label="Gross Tax" value={d.paye.grossTax} />
            <Detail label="Less: Personal Relief" value={d.paye.personalRelief} prefix="-" />
            {d.paye.insuranceRelief > 0 && (
              <Detail label="Less: Insurance Relief" value={d.paye.insuranceRelief} prefix="-" />
            )}
            {d.incomeDeductions?.mortgageInterest > 0 && (
              <Detail label="Less: Mortgage Interest" value={d.incomeDeductions.mortgageInterest} prefix="-" />
            )}
            {d.incomeDeductions?.hosp > 0 && (
              <Detail label="Less: HOSP" value={d.incomeDeductions.hosp} prefix="-" />
            )}
            {d.incomeDeductions?.disability > 0 && (
              <Detail label="Less: Disability Deduction" value={d.incomeDeductions.disability} prefix="-" />
            )}
          </Row>

          <Row label="NSSF (Pension)" value={d.nssf.total} detail>
            <Detail label="Tier I" value={d.nssf.tier1} />
            <Detail label="Tier II" value={d.nssf.tier2} />
          </Row>

          <Row label="SHIF (Health Insurance)" value={d.shif} />
          <Row label="Housing Levy" value={d.housingLevy} />

          {d.incomeDeductions?.pension > 0 && (
            <Row label="Pension (Income Deduction)" value={d.incomeDeductions.pension} />
          )}

          {d.otherDeductions > 0 && (
            <Row label="Other Deductions" value={d.otherDeductions} />
          )}
        </div>
        <div className="bg-gray-100 p-4 flex justify-between font-mono font-bold border-t-2 border-black text-sm md:text-base">
          <span>Total Deductions</span>
          <span>{formatKsh(result.totalDeductions)}</span>
        </div>
      </div>

      <div className="border-2 border-red-600 p-4 md:p-6 bg-red-50">
        <h3 className="font-mono text-base md:text-lg font-bold text-red-600 mb-2">
          You are paying KSH {formatKsh(d.paye.net)} in tax every month
        </h3>
        <p className="font-mono text-xs md:text-sm text-gray-700 mb-4">
          There are legal ways to bring that number down. Pension contributions, mortgage interest, HOSP savings, and insurance relief all chip away at your tax bill. Here is how much you could save.
        </p>
        <Link
          href="/tools/payslip/optimize"
          className="inline-block bg-red-600 text-white font-mono text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 border-2 border-red-600 hover:bg-black hover:border-black transition-colors"
        >
          Show me the savings &rarr; KSH 350 one-time
        </Link>
      </div>

      <div className="border border-gray-300 p-4">
        <h4 className="font-mono text-sm font-bold mb-2 text-gray-600">
          Your Salary in One Picture
        </h4>
        <div className="space-y-2">
          <Bar
            label="Net Pay"
            value={result.keepRate}
            color="bg-black"
            dark
          />
          <Bar
            label="PAYE"
            value={(d.paye.net / result.grossSalary) * 100}
            color="bg-red-600"
          />
          <Bar
            label="NSSF"
            value={(d.nssf.total / result.grossSalary) * 100}
            color="bg-gray-600"
          />
          <Bar
            label="SHIF"
            value={(d.shif / result.grossSalary) * 100}
            color="bg-gray-400"
          />
          <Bar
            label="Housing"
            value={(d.housingLevy / result.grossSalary) * 100}
            color="bg-gray-300"
          />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, detail, children }) {
  return (
    <div className="p-4">
      <div className="flex justify-between mb-1">
        <span className="font-mono font-bold">{label}</span>
        <span className="font-mono">{formatKsh(value)}</span>
      </div>
      {detail && children && (
        <div className="font-mono text-sm text-gray-600 space-y-1 pl-4 border-l-2 border-red-600 mt-2">
          {children}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value, prefix = '' }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>
        {prefix}
        {formatKsh(value)}
      </span>
    </div>
  )
}

function Bar({ label, value, color, dark }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`font-mono w-16 ${dark ? 'font-bold' : 'text-gray-600'}`}>{label}</span>
      <div className="flex-1 h-4 bg-gray-200">
        <div
          className={`h-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono w-12 text-right ${dark ? 'font-bold' : 'text-gray-500'}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}
