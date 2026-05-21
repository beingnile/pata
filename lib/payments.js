/**
 * Payment record store — Upstash Redis
 * Each payment is stored as a JSON string under key `payment:<checkoutRequestId>`
 * TTL: 24 hours (payments are transient; optimize report is delivered immediately on success)
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY = (id) => `payment:${id}`;
const TTL = 60 * 60 * 24; // 24 hours in seconds

export async function recordPayment(checkoutRequestId, details) {
  const record = { ...details, recordedAt: new Date().toISOString() };
  await redis.set(KEY(checkoutRequestId), JSON.stringify(record), { ex: TTL });
  return record;
}

export async function getPayment(checkoutRequestId) {
  const raw = await redis.get(KEY(checkoutRequestId));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function updatePayment(checkoutRequestId, updates) {
  const existing = await getPayment(checkoutRequestId);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  // Reset TTL on update so a payment that just completed stays readable
  await redis.set(KEY(checkoutRequestId), JSON.stringify(updated), { ex: TTL });
  return updated;
}

export async function listPayments() {
  const keys = await redis.keys('payment:*');
  if (!keys.length) return {};
  const values = await redis.mget(...keys);
  return Object.fromEntries(
    keys.map((k, i) => {
      const val = values[i];
      return [k.replace('payment:', ''), typeof val === 'string' ? JSON.parse(val) : val];
    })
  );
}
