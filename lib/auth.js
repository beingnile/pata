import bcrypt from 'bcryptjs'
import { getUser, createUser } from './users'

const SALT_ROUNDS = 10

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a plain-text password against a hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

/**
 * Find or create a user during OAuth sign-in.
 * @param {string} email
 * @returns {Promise<object>}
 */
export async function ensureOAuthUser(email) {
  const existing = await getUser(email)
  if (existing) return existing

  // OAuth users have no local password.
  return createUser(email, '')
}

/**
 * Register a user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, error?: string, user?: object }>}
 */
export async function registerUser(email, password) {
  const normalizedEmail = email.toLowerCase().trim()
  if (!normalizedEmail || !password || password.length < 6) {
    return { success: false, error: 'Email and password (min 6 chars) required' }
  }

  const existing = await getUser(normalizedEmail)
  if (existing) {
    return { success: false, error: 'An account with this email already exists' }
  }

  const passwordHash = await hashPassword(password)
  const user = await createUser(normalizedEmail, passwordHash)
  return { success: true, user }
}

/**
 * Validate email/password credentials.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, error?: string, user?: object }>}
 */
export async function validateCredentials(email, password) {
  const normalizedEmail = email.toLowerCase().trim()
  const user = await getUser(normalizedEmail)
  if (!user) {
    return { success: false, error: 'Invalid email or password' }
  }

  // OAuth users have empty passwordHash and must use OAuth login.
  if (!user.passwordHash) {
    return { success: false, error: 'Please sign in with Google' }
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return { success: false, error: 'Invalid email or password' }
  }

  return { success: true, user }
}
