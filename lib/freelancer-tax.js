/**
 * Kenyan freelancer tax helpers.
 * Based on KRA guidance and the Finance Act 2024/2025 rates.
 * Rates change over time; always verify on kra.go.ke before filing.
 */

/** Annual personal relief (tax credit) */
export const ANNUAL_PERSONAL_RELIEF = 28800

/** Annual progressive income tax brackets for resident individuals */
export const ANNUAL_TAX_BRACKETS = [
  { upper: 288000, rate: 0.10 },
  { upper: 388000, rate: 0.25 },
  { upper: 6000000, rate: 0.30 },
  { upper: 9600000, rate: 0.325 },
  { upper: Infinity, rate: 0.35 },
]

/** Turnover Tax (TOT) defaults */
export const TOT_RATE = 0.03
export const TOT_MIN_TURNOVER = 1000000
export const TOT_MAX_TURNOVER = 50000000

/** VAT registration threshold */
export const VAT_THRESHOLD = 5000000
export const VAT_RATE = 0.16

/** Common resident withholding tax rates */
export const WHT_RATES = {
  professional: 0.05,
  contractual: 0.03,
  training: 0.05,
  interest: 0.15,
  dividends: 0.05,
  rent: 0.10,
}

/**
 * Calculate income tax under the standard income tax regime.
 * @param {number} annualGrossIncome
 * @param {number} annualExpenses
 * @returns {object}
 */
export function calculateStandardIncomeTax(annualGrossIncome, annualExpenses = 0) {
  const taxableIncome = Math.max(0, annualGrossIncome - annualExpenses)
  let grossTax = 0
  let remaining = taxableIncome
  let prevUpper = 0

  for (const bracket of ANNUAL_TAX_BRACKETS) {
    if (remaining <= 0) break
    const bracketSize = bracket.upper === Infinity ? remaining : bracket.upper - prevUpper
    const taxableInBracket = Math.min(remaining, bracketSize)
    if (taxableInBracket > 0) {
      grossTax += taxableInBracket * bracket.rate
      remaining -= taxableInBracket
    }
    prevUpper = bracket.upper
  }

  const netTax = Math.max(0, grossTax - ANNUAL_PERSONAL_RELIEF)
  const effectiveRate = annualGrossIncome > 0 ? (netTax / annualGrossIncome) * 100 : 0

  return {
    regime: 'Standard Income Tax',
    taxableIncome: Math.round(taxableIncome),
    grossTax: Math.round(grossTax),
    personalRelief: ANNUAL_PERSONAL_RELIEF,
    netTax: Math.round(netTax),
    effectiveRate: parseFloat(effectiveRate.toFixed(2)),
  }
}

/**
 * Calculate Turnover Tax (TOT) for small businesses.
 * @param {number} annualTurnover
 * @returns {object}
 */
export function calculateTurnoverTax(annualTurnover) {
  const eligible = annualTurnover >= TOT_MIN_TURNOVER && annualTurnover <= TOT_MAX_TURNOVER
  const netTax = eligible ? annualTurnover * TOT_RATE : 0
  const effectiveRate = annualTurnover > 0 ? (netTax / annualTurnover) * 100 : 0

  return {
    regime: 'Turnover Tax (TOT)',
    eligible,
    minTurnover: TOT_MIN_TURNOVER,
    maxTurnover: TOT_MAX_TURNOVER,
    rate: TOT_RATE,
    netTax: Math.round(netTax),
    effectiveRate: parseFloat(effectiveRate.toFixed(2)),
  }
}

/**
 * Compare Standard Income Tax vs Turnover Tax and recommend the cheaper option.
 * @param {number} annualTurnover
 * @param {number} annualExpenses
 * @returns {object}
 */
export function compareRegimes(annualTurnover, annualExpenses = 0) {
  const standard = calculateStandardIncomeTax(annualTurnover, annualExpenses)
  const tot = calculateTurnoverTax(annualTurnover)

  let recommended = ''
  if (!tot.eligible) {
    recommended = 'standard'
  } else if (standard.netTax <= tot.netTax) {
    recommended = 'standard'
  } else {
    recommended = 'tot'
  }

  const savings = Math.abs(standard.netTax - tot.netTax)

  return {
    standard,
    tot,
    recommended,
    savings: Math.round(savings),
  }
}

/**
 * Calculate withholding tax on a payment.
 * @param {number} amount
 * @param {number} rate
 * @returns {object}
 */
export function calculateWithholdingTax(amount, rate = WHT_RATES.professional) {
  const tax = amount * rate
  const net = amount - tax
  return {
    gross: amount,
    rate,
    tax: Math.round(tax),
    net: Math.round(net),
  }
}

/**
 * Check whether a freelancer should register for VAT.
 * @param {number} annualTaxableTurnover
 * @returns {object}
 */
export function vatStatus(annualTaxableTurnover) {
  const required = annualTaxableTurnover >= VAT_THRESHOLD
  return {
    required,
    threshold: VAT_THRESHOLD,
    currentTurnover: annualTaxableTurnover,
    remainingToThreshold: Math.max(0, VAT_THRESHOLD - annualTaxableTurnover),
  }
}

/**
 * Format KSH currency.
 * @param {number} amount
 * @returns {string}
 */
export function formatKsh(amount) {
  return `KSH ${Math.round(amount).toLocaleString('en-KE')}`
}
