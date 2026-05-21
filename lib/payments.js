/**
 * Payment record store (in-memory with JSON file persistence for MVP)
 * Replace with a real database in production (e.g., Supabase, PlanetScale)
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PAYMENTS_FILE)) {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify({}));
  }
}

function readPayments() {
  ensureDir();
  try {
    const data = fs.readFileSync(PAYMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function writePayments(payments) {
  ensureDir();
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
}

export function recordPayment(checkoutRequestId, details) {
  const payments = readPayments();
  payments[checkoutRequestId] = {
    ...details,
    recordedAt: new Date().toISOString(),
  };
  writePayments(payments);
  return payments[checkoutRequestId];
}

export function getPayment(checkoutRequestId) {
  const payments = readPayments();
  return payments[checkoutRequestId] || null;
}

export function updatePayment(checkoutRequestId, updates) {
  const payments = readPayments();
  if (!payments[checkoutRequestId]) return null;
  payments[checkoutRequestId] = { ...payments[checkoutRequestId], ...updates };
  writePayments(payments);
  return payments[checkoutRequestId];
}

export function listPayments() {
  return readPayments();
}
