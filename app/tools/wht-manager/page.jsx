'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { WHT_RATES } from '@/lib/wht'

function formatKsh(amount) {
  return `KSH ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatRate(rate) {
  return `${(rate * 100).toFixed(0)}%`
}

const TABS = ['payees', 'transactions', 'summary']

export default function WhtManagerPage() {
  const [activeTab, setActiveTab] = useState('payees')
  const [payees, setPayees] = useState([])
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [payeesRes, transactionsRes, summaryRes] = await Promise.all([
        fetch('/api/wht/payees'),
        fetch('/api/wht/transactions'),
        fetch('/api/wht/summary'),
      ])

      if (payeesRes.ok) {
        const data = await payeesRes.json()
        setPayees(data.payees)
      }
      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setTransactions(data.transactions)
      }
      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data.summary)
      }
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [payeesRes, transactionsRes, summaryRes] = await Promise.all([
          fetch('/api/wht/payees'),
          fetch('/api/wht/transactions'),
          fetch('/api/wht/summary'),
        ])
        if (!mounted) return
        if (payeesRes.ok) setPayees((await payeesRes.json()).payees)
        if (transactionsRes.ok) setTransactions((await transactionsRes.json()).transactions)
        if (summaryRes.ok) setSummary((await summaryRes.json()).summary)
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load data')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const totalOutstanding = useMemo(() => {
    return summary.reduce((sum, s) => sum + s.totalTax, 0)
  }, [summary])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link
          href="/tools"
          className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white transition-colors"
        >
          &larr; Back to tools
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-mono text-4xl md:text-5xl font-bold mb-2">WHT Manager</h1>
            <p className="font-mono text-lg text-gray-600">
              Track withholding tax on payments to suppliers, freelancers, landlords, and service
              providers.
            </p>
          </div>
          <div className="border-2 border-black p-4 bg-black text-white">
            <p className="font-mono text-xs text-gray-400">Total WHT tracked</p>
            <p className="font-mono text-2xl font-bold">{formatKsh(totalOutstanding)}</p>
          </div>
        </div>

        {error && <p className="font-mono text-red-600 mb-6">{error}</p>}

        <div className="border-b-2 border-black mb-8">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-mono text-sm uppercase border-t-2 border-l-2 border-r-2 border-black -mb-[2px] transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-black font-bold'
                    : 'bg-black text-white hover:bg-red-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="font-mono text-gray-600">Loading...</p>
        ) : (
          <>
            {activeTab === 'payees' && (
              <PayeesTab payees={payees} onChange={fetchData} />
            )}
            {activeTab === 'transactions' && (
              <TransactionsTab
                payees={payees}
                transactions={transactions}
                onChange={fetchData}
              />
            )}
            {activeTab === 'summary' && <SummaryTab summary={summary} transactions={transactions} />}
          </>
        )}
      </div>
    </div>
  )
}

function PayeesTab({ payees, onChange }) {
  const [form, setForm] = useState({ name: '', kraPin: '', type: 'resident_professional', email: '', phone: '' })
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const url = editing ? `/api/wht/payees/${editing.id}` : '/api/wht/payees'
    const method = editing ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...form } : form),
      })
      if (!res.ok) throw new Error('Failed to save payee')
      setForm({ name: '', kraPin: '', type: 'resident_professional', email: '', phone: '' })
      setEditing(null)
      onChange()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this payee?')) return
    await fetch(`/api/wht/payees/${id}`, { method: 'DELETE' })
    onChange()
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="border-2 border-black p-6">
        <h2 className="font-mono text-lg font-bold mb-4">
          {editing ? 'Edit payee' : 'Add a payee'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="KRA PIN" value={form.kraPin} onChange={(v) => setForm({ ...form, kraPin: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <div className="md:col-span-2">
            <label className="block font-mono text-xs font-bold mb-1">Default WHT type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border-2 border-black p-2 font-mono text-sm focus:outline-none focus:bg-red-50 bg-white"
            >
              {Object.entries(WHT_RATES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white font-mono text-sm px-6 py-2 border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors disabled:opacity-50 uppercase"
          >
            {loading ? 'Saving...' : editing ? 'Update payee' : 'Add payee'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setForm({ name: '', kraPin: '', type: 'resident_professional', email: '', phone: '' })
              }}
              className="bg-white text-black font-mono text-sm px-6 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors uppercase"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="border-2 border-black overflow-hidden">
        <div className="bg-black text-white p-3 font-mono text-sm font-bold">Your payees</div>
        {payees.length === 0 ? (
          <p className="p-6 font-mono text-gray-500">No payees yet. Add one to get started.</p>
        ) : (
          <div className="divide-y-2 divide-black">
            {payees.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-mono font-bold">{p.name}</p>
                  <p className="font-mono text-xs text-gray-600">
                    {WHT_RATES[p.type]?.label || p.type} · {p.kraPin || 'No KRA PIN'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(p)
                      setForm({
                        name: p.name,
                        kraPin: p.kraPin,
                        type: p.type,
                        email: p.email,
                        phone: p.phone,
                      })
                    }}
                    className="font-mono text-xs underline hover:text-red-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="font-mono text-xs underline hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TransactionsTab({ payees, transactions, onChange }) {
  const [form, setForm] = useState({
    payeeId: '',
    payeeName: '',
    description: '',
    amount: '',
    type: 'resident_professional',
    date: new Date().toISOString().slice(0, 10),
    certificateIssued: false,
  })
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const selectedPayee = payees.find((p) => p.id === form.payeeId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const url = editing ? `/api/wht/transactions/${editing.id}` : '/api/wht/transactions'
    const method = editing ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save transaction')
      setForm({
        payeeId: '',
        payeeName: '',
        description: '',
        amount: '',
        type: 'resident_professional',
        date: new Date().toISOString().slice(0, 10),
        certificateIssued: false,
      })
      setEditing(null)
      onChange()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    await fetch(`/api/wht/transactions/${id}`, { method: 'DELETE' })
    onChange()
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="border-2 border-black p-6">
        <h2 className="font-mono text-lg font-bold mb-4">
          {editing ? 'Edit transaction' : 'Record a payment'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-mono text-xs font-bold mb-1">Payee</label>
            <select
              value={form.payeeId}
              onChange={(e) => {
                const payee = payees.find((p) => p.id === e.target.value)
                const isExistingPayee = Boolean(payee) && !editing
                setForm({
                  ...form,
                  payeeId: e.target.value,
                  payeeName: payee?.name || '',
                  type: isExistingPayee ? payee.type : form.type,
                })
              }}
              className="w-full border-2 border-black p-2 font-mono text-sm focus:outline-none focus:bg-red-50 bg-white"
            >
              <option value="">Select or type below</option>
              {payees.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Payee name (manual)"
            value={form.payeeName}
            onChange={(v) => setForm({ ...form, payeeName: v })}
            required
          />
          <Field
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="e.g. Website design"
          />
          <Field
            label="Gross amount (KSH)"
            type="number"
            value={form.amount}
            onChange={(v) => setForm({ ...form, amount: v })}
            required
          />
          <Field
            label="Date"
            type="date"
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v })}
            required
          />
          <div>
            <label className="block font-mono text-xs font-bold mb-1">WHT type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border-2 border-black p-2 font-mono text-sm focus:outline-none focus:bg-red-50 bg-white"
            >
              {Object.entries(WHT_RATES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              id="certificate"
              checked={form.certificateIssued}
              onChange={(e) => setForm({ ...form, certificateIssued: e.target.checked })}
              className="w-4 h-4 border-2 border-black"
            />
            <label htmlFor="certificate" className="font-mono text-sm">
              WHT certificate issued
            </label>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white font-mono text-sm px-6 py-2 border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors disabled:opacity-50 uppercase"
          >
            {loading ? 'Saving...' : editing ? 'Update transaction' : 'Record transaction'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setForm({
                  payeeId: '',
                  payeeName: '',
                  description: '',
                  amount: '',
                  type: 'resident_professional',
                  date: new Date().toISOString().slice(0, 10),
                  certificateIssued: false,
                })
              }}
              className="bg-white text-black font-mono text-sm px-6 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors uppercase"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="border-2 border-black overflow-hidden">
        <div className="bg-black text-white p-3 font-mono text-sm font-bold">Transactions</div>
        {sortedTransactions.length === 0 ? (
          <p className="p-6 font-mono text-gray-500">No transactions yet.</p>
        ) : (
          <div className="divide-y-2 divide-black">
            {sortedTransactions.map((t) => (
              <div key={t.id} className="p-4 grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                <div className="md:col-span-2">
                  <p className="font-mono font-bold">{t.payeeName}</p>
                  <p className="font-mono text-xs text-gray-600">
                    {t.description} · {new Date(t.date).toLocaleDateString('en-KE')}
                  </p>
                </div>
                <div className="font-mono text-sm">
                  <p>Gross: {formatKsh(t.amount)}</p>
                  <p className="text-red-600">WHT: {formatKsh(t.tax)}</p>
                </div>
                <div className="font-mono text-xs text-gray-600">
                  {formatRate(t.rate)}
                  {t.certificateIssued && (
                    <span className="ml-2 text-green-700 font-bold">Cert issued</span>
                  )}
                </div>
                <div className="flex gap-2 md:justify-end">
                  <button
                    onClick={() => {
                      setEditing(t)
                      setForm({
                        payeeId: t.payeeId || '',
                        payeeName: t.payeeName,
                        description: t.description,
                        amount: t.amount,
                        type: t.type,
                        date: t.date,
                        certificateIssued: t.certificateIssued,
                      })
                    }}
                    className="font-mono text-xs underline hover:text-red-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="font-mono text-xs underline hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryTab({ summary, transactions }) {
  const exportCsv = () => {
    const headers = ['Month', 'Transactions', 'Gross Payments', 'WHT Due', 'Due Date']
    const rows = summary.map((s) => [s.month, s.count, s.totalGross, s.totalTax, s.dueDate])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pata-wht-summary-${new Date().getFullYear()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportTransactions = () => {
    const headers = [
      'Date',
      'Payee',
      'Description',
      'Gross Amount',
      'WHT Rate',
      'WHT Tax',
      'Net Amount',
      'Certificate Issued',
    ]
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    const rows = sorted.map((t) => [
      t.date,
      t.payeeName,
      t.description,
      t.amount,
      formatRate(t.rate),
      t.tax,
      t.net,
      t.certificateIssued ? 'Yes' : 'No',
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pata-wht-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={exportCsv}
          className="bg-black text-white font-mono text-sm px-6 py-2 border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors uppercase"
        >
          Export monthly summary CSV
        </button>
        <button
          onClick={exportTransactions}
          className="bg-white text-black font-mono text-sm px-6 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors uppercase"
        >
          Export transactions CSV
        </button>
      </div>

      <div className="border-2 border-black overflow-hidden">
        <div className="bg-black text-white p-3 font-mono text-sm font-bold">
          Monthly WHT summary
        </div>
        {summary.length === 0 ? (
          <p className="p-6 font-mono text-gray-500">No transactions recorded yet.</p>
        ) : (
          <div className="divide-y-2 divide-black">
            {summary.map((s) => (
              <div
                key={s.month}
                className="p-4 grid grid-cols-1 md:grid-cols-4 gap-2 items-center"
              >
                <div className="font-mono font-bold">{s.month}</div>
                <div className="font-mono text-sm">{s.count} transaction(s)</div>
                <div className="font-mono text-sm">
                  Gross: {formatKsh(s.totalGross)}
                  <br />
                  <span className="text-red-600">WHT: {formatKsh(s.totalTax)}</span>
                </div>
                <div className="font-mono text-xs text-gray-600">
                  Remit by: {new Date(s.dueDate).toLocaleDateString('en-KE')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-2 border-red-600 p-4 bg-red-50">
        <h3 className="font-mono font-bold text-red-600 mb-2">Important</h3>
        <p className="font-mono text-sm text-gray-700">
          WHT must be remitted to KRA by the <strong>20th day of the month following the deduction</strong>.
          Late remittance attracts a 5% penalty and 1% monthly interest. Always verify rates on{' '}
          <a
            href="https://www.kra.go.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-red-600"
          >
            kra.go.ke
          </a>{' '}
          before filing.
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="block font-mono text-xs font-bold mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border-2 border-black p-2 font-mono text-sm focus:outline-none focus:bg-red-50"
      />
    </div>
  )
}
