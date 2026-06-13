import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const USER_KEY = (email) => `user:${email.toLowerCase()}`
const SUBSCRIPTION_KEY = (email) => `subscription:${email.toLowerCase()}`
const SCANS_KEY = (email) => `scans:${email.toLowerCase()}`

/**
 * Get a user by email.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export async function getUser(email) {
  if (!email) return null
  const raw = await redis.get(USER_KEY(email))
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

/**
 * Create a new user.
 * @param {string} email
 * @param {string} passwordHash
 * @returns {Promise<object>}
 */
export async function createUser(email, passwordHash) {
  const normalizedEmail = email.toLowerCase().trim()
  const user = {
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  }
  await redis.set(USER_KEY(normalizedEmail), JSON.stringify(user))
  return user
}

/**
 * Get subscription details for a user.
 * @param {string} email
 * @returns {Promise<object>}
 */
export async function getSubscription(email) {
  const raw = await redis.get(SUBSCRIPTION_KEY(email.toLowerCase()))
  if (!raw) {
    return {
      active: false,
      plan: 'free',
      expiresAt: null,
    }
  }

  const sub = typeof raw === 'string' ? JSON.parse(raw) : raw
  const now = new Date().toISOString()
  const active = sub.expiresAt && sub.expiresAt > now

  return {
    ...sub,
    active,
    plan: active ? sub.plan : 'free',
  }
}

/**
 * Extend a user's subscription by a number of days.
 * @param {string} email
 * @param {number} days
 * @param {string} plan
 * @returns {Promise<object>}
 */
export async function extendSubscription(email, days = 30, plan = 'monthly') {
  const existing = await getSubscription(email)
  const now = new Date()

  // If currently active, extend from current expiry. Otherwise extend from now.
  const baseDate = existing.active && existing.expiresAt ? new Date(existing.expiresAt) : now
  const expiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

  const sub = {
    plan,
    expiresAt,
    updatedAt: now.toISOString(),
  }

  await redis.set(SUBSCRIPTION_KEY(email.toLowerCase()), JSON.stringify(sub))
  return { ...sub, active: true }
}

/**
 * Get the number of receipts a user has scanned.
 * @param {string} email
 * @returns {Promise<number>}
 */
export async function getScanCount(email) {
  const count = await redis.get(SCANS_KEY(email.toLowerCase()))
  return Number(count) || 0
}

/**
 * Increment a user's scan count.
 * @param {string} email
 * @param {number} amount
 * @returns {Promise<number>}
 */
export async function incrementScanCount(email, amount = 1) {
  return redis.incrby(SCANS_KEY(email.toLowerCase()), amount)
}

/**
 * Check whether a user can scan more receipts.
 * Free tier gets 3 scans lifetime.
 * @param {string} email
 * @returns {Promise<{ allowed: boolean, reason: string|null, scanCount: number }>}
 */
export async function canScan(email) {
  const sub = await getSubscription(email)
  if (sub.active) return { allowed: true, reason: null, scanCount: await getScanCount(email) }

  const scanCount = await getScanCount(email)
  if (scanCount < 3) return { allowed: true, reason: 'free_scan', scanCount }
  return { allowed: false, reason: 'subscription_required', scanCount }
}
