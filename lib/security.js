/**
 * Security utilities for PATA API routes
 * Rate limiting, CSRF, input sanitization
 */

import { LRUCache } from 'lru-cache';
import { z } from 'zod';

// Simple in-memory rate limiter backed by LRUCache
const rateLimitCache = new LRUCache({
  max: 1000, // max 1000 IPs
  ttl: 60_000, // 1 minute window
});

/**
 * Rate limit by IP + route identifier
 * @param {string} ip - Requester IP
 * @param {string} route - Route identifier
 * @param {number} limit - Max requests per window
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
export function rateLimit(ip, route = 'default', limit = 30) {
  const key = `${ip}:${route}`;
  const now = Date.now();
  const record = rateLimitCache.get(key) || { count: 0, firstRequest: now };

  // Reset if window expired
  if (now - record.firstRequest > 60_000) {
    record.count = 0;
    record.firstRequest = now;
  }

  record.count += 1;

  if (record.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.firstRequest + 60_000,
    };
  }

  rateLimitCache.set(key, record);
  return {
    allowed: true,
    remaining: Math.max(0, limit - record.count),
    resetAt: record.firstRequest + 60_000,
  };
}

// CSRF token store (in-memory, 1-hour expiry)
const csrfStore = new LRUCache({
  max: 2000,
  ttl: 60 * 60 * 1000,
});

/**
 * Generate a CSRF token
 * @returns {string}
 */
export function generateCsrfToken() {
  const token = crypto.randomUUID();
  csrfStore.set(token, { createdAt: Date.now() });
  return token;
}

/**
 * Validate a CSRF token (one-time use)
 * @param {string} token
 * @returns {boolean}
 */
export function validateCsrfToken(token) {
  if (!token || typeof token !== 'string') return false;
  // Allow tokens up to 2 uses (for retries)
  const record = csrfStore.get(token);
  if (!record) return false;
  if (record.used) {
    csrfStore.delete(token);
    return false;
  }
  record.used = true;
  return true;
}

/**
 * Safely extract client IP from request headers
 * @param {Request} req
 * @returns {string}
 */
export function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

/**
 * Sanitize Kenyan phone number
 * @param {string} raw
 * @returns {{ valid: boolean, formatted: string|null, error: string|null }}
 */
export function sanitizePhone(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, formatted: null, error: 'Phone number is required' };
  }

  const digits = raw.replace(/\D/g, '');

  let normalized = digits;
  if (normalized.startsWith('0')) {
    normalized = `254${normalized.slice(1)}`;
  } else if (normalized.startsWith('7') || normalized.startsWith('1')) {
    normalized = `254${normalized}`;
  }

  if (!/^254[71]\d{8}$/.test(normalized)) {
    return {
      valid: false,
      formatted: null,
      error: 'Invalid phone number. Use format 07XX XXX XXX or 2547XX XXX XXX',
    };
  }

  return { valid: true, formatted: normalized, error: null };
}

/**
 * Zod schemas for API validation
 */
export const schemas = {
  payslipInput: z.object({
    grossSalary: z.number().min(0).max(50_000_000),
    optional: z
      .object({
        pensionContribution: z.number().min(0).optional(),
        insurancePremium: z.number().min(0).optional(),
        mortgageInterest: z.number().min(0).optional(),
        hospContribution: z.number().min(0).optional(),
        lifeInsurance: z.number().min(0).optional(),
        isDisabled: z.boolean().optional(),
        otherDeductions: z.number().min(0).optional(),
      })
      .optional(),
  }),

  paymentInit: z.object({
    phone: z.string().min(10).max(13),
    amount: z.number().min(1).max(100_000),
  }),

  stkCallback: z.object({
    Body: z.object({
      stkCallback: z.object({
        MerchantRequestID: z.string(),
        CheckoutRequestID: z.string(),
        ResultCode: z.number(),
        ResultDesc: z.string().optional(),
        CallbackMetadata: z
          .object({
            Item: z.array(
              z.object({ Name: z.string(), Value: z.union([z.string(), z.number()]).optional() })
            ),
          })
          .optional(),
      }),
    }),
  }),
};