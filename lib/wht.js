import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const PAYEES_KEY = (email) => `wht:payees:${email.toLowerCase()}`
const TRANSACTIONS_KEY = (email) => `wht:transactions:${email.toLowerCase()}`

export const WHT_RATES = {
  resident_professional: { label: 'Professional / consultancy (resident)', rate: 0.05 },
  resident_contractual: { label: 'Contractual services (resident)', rate: 0.03 },
  resident_training: { label: 'Training / digital services (resident)', rate: 0.05 },
  resident_interest: { label: 'Interest income (resident)', rate: 0.15 },
  resident_dividends: { label: 'Dividends (resident)', rate: 0.05 },
  resident_rent: { label: 'Rent / leasing (resident)', rate: 0.1 },
  nonresident_professional: { label: 'Professional / management (non-resident)', rate: 0.2 },
  nonresident_rent: { label: 'Rent / leasing (non-resident)', rate: 0.3 },
  nonresident_royalties: { label: 'Royalties (non-resident)', rate: 0.2 },
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Get all WHT payees for a user.
 * @param {string} email
 */
export async function getPayees(email) {
  const raw = await redis.get(PAYEES_KEY(email))
  if (!raw) return []
  return Array.isArray(raw) ? raw : JSON.parse(raw)
}

/**
 * Save the full payees list for a user.
 * @param {string} email
 * @param {Array} payees
 */
export async function savePayees(email, payees) {
  await redis.set(PAYEES_KEY(email), JSON.stringify(payees))
  return payees
}

/**
 * Create a new payee.
 * @param {string} email
 * @param {object} data
 */
export async function createPayee(email, data) {
  const payees = await getPayees(email)
  const payee = {
    id: generateId(),
    name: data.name?.trim() || '',
    kraPin: data.kraPin?.trim().toUpperCase() || '',
    type: data.type || 'resident_professional',
    residency: data.residency || 'resident',
    email: data.email?.trim().toLowerCase() || '',
    phone: data.phone?.trim() || '',
    createdAt: new Date().toISOString(),
  }
  payees.push(payee)
  await savePayees(email, payees)
  return payee
}

/**
 * Update a payee.
 * @param {string} email
 * @param {string} id
 * @param {object} updates
 */
export async function updatePayee(email, id, updates) {
  const payees = await getPayees(email)
  const index = payees.findIndex((p) => p.id === id)
  if (index === -1) return null
  payees[index] = { ...payees[index], ...updates, id }
  await savePayees(email, payees)
  return payees[index]
}

/**
 * Delete a payee.
 * @param {string} email
 * @param {string} id
 */
export async function deletePayee(email, id) {
  const payees = await getPayees(email)
  const filtered = payees.filter((p) => p.id !== id)
  await savePayees(email, filtered)
  return filtered
}

/**
 * Get all WHT transactions for a user.
 * @param {string} email
 */
export async function getTransactions(email) {
  const raw = await redis.get(TRANSACTIONS_KEY(email))
  if (!raw) return []
  return Array.isArray(raw) ? raw : JSON.parse(raw)
}

/**
 * Save all transactions for a user.
 * @param {string} email
 * @param {Array} transactions
 */
export async function saveTransactions(email, transactions) {
  await redis.set(TRANSACTIONS_KEY(email), JSON.stringify(transactions))
  return transactions
}

/**
 * Calculate withholding tax for a given type and amount.
 * @param {number} amount
 * @param {string} type
 */
export function calculateWht(amount, type) {
  const config = WHT_RATES[type] || WHT_RATES.resident_professional
  const tax = Math.round(amount * config.rate)
  return {
    gross: amount,
    rate: config.rate,
    tax,
    net: amount - tax,
    label: config.label,
  }
}

/**
 * Create a new WHT transaction.
 * @param {string} email
 * @param {object} data
 */
export async function createTransaction(email, data) {
  const transactions = await getTransactions(email)
  const calc = calculateWht(Number(data.amount), data.type)
  const transaction = {
    id: generateId(),
    payeeId: data.payeeId || null,
    payeeName: data.payeeName || '',
    description: data.description || '',
    amount: calc.gross,
    type: data.type,
    rate: calc.rate,
    tax: calc.tax,
    net: calc.net,
    date: data.date || new Date().toISOString().slice(0, 10),
    certificateIssued: data.certificateIssued || false,
    createdAt: new Date().toISOString(),
  }
  transactions.push(transaction)
  await saveTransactions(email, transactions)
  return transaction
}

/**
 * Update a transaction.
 * @param {string} email
 * @param {string} id
 * @param {object} updates
 */
export async function updateTransaction(email, id, updates) {
  const transactions = await getTransactions(email)
  const index = transactions.findIndex((t) => t.id === id)
  if (index === -1) return null

  const existing = transactions[index]
  const amount = updates.amount !== undefined ? Number(updates.amount) : existing.amount
  const type = updates.type || existing.type
  const calc = calculateWht(amount, type)

  transactions[index] = {
    ...existing,
    ...updates,
    id,
    amount: calc.gross,
    type,
    rate: calc.rate,
    tax: calc.tax,
    net: calc.net,
  }

  await saveTransactions(email, transactions)
  return transactions[index]
}

/**
 * Delete a transaction.
 * @param {string} email
 * @param {string} id
 */
export async function deleteTransaction(email, id) {
  const transactions = await getTransactions(email)
  const filtered = transactions.filter((t) => t.id !== id)
  await saveTransactions(email, filtered)
  return filtered
}

/**
 * Get monthly WHT summary.
 * @param {string} email
 * @param {number} year
 */
export async function getMonthlySummary(email, year = new Date().getFullYear()) {
  const transactions = await getTransactions(email)
  const summary = {}

  for (const t of transactions) {
    const d = new Date(t.date)
    if (d.getFullYear() !== year) continue
    const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!summary[monthKey]) {
      summary[monthKey] = { month: monthKey, totalGross: 0, totalTax: 0, count: 0, dueDate: '' }
    }
    summary[monthKey].totalGross += t.amount
    summary[monthKey].totalTax += t.tax
    summary[monthKey].count += 1
    // WHT is due by the 20th of the following month
    const due = new Date(d.getFullYear(), d.getMonth() + 2, 20)
    summary[monthKey].dueDate = due.toISOString().slice(0, 10)
  }

  return Object.values(summary).sort((a, b) => a.month.localeCompare(b.month))
}
