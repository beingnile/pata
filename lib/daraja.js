/**
 * Safaricom Daraja API Client
 * M-Pesa C2B / STK Push integration
 * All credentials from environment variables only
 */
const BASE_URL =
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

/**
 * Safaricom OAuth access token endpoint
 * Consumer Key + Consumer Secret → Bearer token
 */
async function fetchAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daraja auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Initiate STK Push (Pin required on user's phone)
 * @param {Object} params
 * @param {string} params.phone - 254XXXXXXXXX normalized
 * @param {number} params.amount - Amount in KSH
 * @param {string} params.accountReference - Appears in M-Pesa SMS
 * @param {string} params.transactionDesc - Short description
 * @param {string} params.callbackUrl - HTTPS endpoint reachable by Safaricom
 * @returns {Promise<{CheckoutRequestID:string, MerchantRequestID:string, ResponseCode:string, ResponseDescription:string}>}
 */
export async function initStkPush({ phone, amount, accountReference, transactionDesc, callbackUrl }) {
  const accessToken = await fetchAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  if (!shortcode || !passkey) {
    throw new Error('Missing MPESA_SHORTCODE or MPESA_PASSKEY');
  }

  // STK push requires a timestamp and password encoded from shortcode+passkey+timestamp
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (res.ok && data.ResponseCode === '0') {
    return data;
  }

  throw new Error(data.errorMessage || data.ResponseDescription || `STK push failed: ${res.status}`);
}

/**
 * Query STK Push transaction status
 * @param {string} checkoutRequestId
 * @returns {Promise<any>}
 */
export async function queryStkPush(checkoutRequestId) {
  const accessToken = await fetchAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  return await res.json();
}
