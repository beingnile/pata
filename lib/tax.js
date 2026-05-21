/**
 * Kenyan Tax Calculator - PATA
 * Implements official KRA PAYE rates as per Finance Act 2024/2025
 * All monetary values in KSH
 *
 * CORRECT TAX STRUCTURE:
 *   INCOME DEDUCTIONS (reduce taxable income before PAYE brackets):
 *     - Pension contributions to registered scheme (max 20,000/mo)
 *     - Mortgage interest (max 25,000/mo)
 *     - HOSP deposits (max 8,000/mo)
 *     - Disability deduction (150,000/mo)
 *   TAXABLE INCOME = Gross Salary - Income Deductions
 *   GROSS TAX = Progressive(PAYE brackets) on Taxable Income
 *   TAX CREDITS (reliefs, subtracted from Gross Tax):
 *     - Personal relief (2,400/mo)
 *     - Insurance relief (15% of premium, max 5,000/mo)
 *   NET PAYE = max(0, Gross Tax - Tax Credits)
 *   STATUTORY DEDUCTIONS (taken from gross, do not reduce PAYE):
 *     - NSSF, SHIF, Housing Levy
 *   NET SALARY = Gross - NET PAYE - NSSF - SHIF - Housing Levy - Pension - Other
 */

/** 2026 Monthly PAYE tax brackets */
const MONTHLY_TAX_BRACKETS = [
  { upper: 24000, rate: 0.10 },        // first 24,000
  { upper: 32333, rate: 0.25 },        // next 8,333
  { upper: 500000, rate: 0.30 },       // next 467,667
  { upper: 800000, rate: 0.325 },      // next 300,000
  { upper: Infinity, rate: 0.35 },     // remainder
];

/** Monthly personal relief (TAX CREDIT) */
const MONTHLY_PERSONAL_RELIEF = 2400;

/** NSSF Tier 1: 6% on first KSH 9,000 */
const NSSF_TIER1_RATE = 0.06;
const NSSF_TIER1_MAX_BASE = 9000;

/** NSSF Tier 2: 6% on earnings from KSH 9,001 to KSH 108,000 */
const NSSF_TIER2_RATE = 0.06;
const NSSF_TIER2_MAX_BASE = 108000;

/** SHIF rate: 2.75% of gross salary, minimum KSH 300 */
const SHIF_RATE = 0.0275;
const SHIF_MIN = 300;

/** Housing Levy rate: 1.5% of gross salary */
const HOUSING_LEVY_RATE = 0.015;

/** Insurance relief: 15% of premiums, capped at KSH 5,000/mo (TAX CREDIT) */
const INSURANCE_RELIEF_RATE = 0.15;
const INSURANCE_RELIEF_CAP = 5000;

/** Disability income deduction: KSH 150,000/mo (INCOME DEDUCTION) */
const DISABILITY_DEDUCTION = 150000;

/** Pension income deduction cap per month (INCOME DEDUCTION) */
const PENSION_DEDUCTION_CAP = 20000;

/** Mortgage interest deduction cap per month (INCOME DEDUCTION, not a tax credit) */
const MORTGAGE_DEDUCTION_CAP = 25000;

/** HOSP deduction cap per month (INCOME DEDUCTION, not a tax credit) */
const HOSP_DEDUCTION_CAP = 8000;

/**
 * Calculate PAYE using progressive tax brackets.
 * @param {number} taxableIncome - Income after income deductions
 * @returns {number} Gross PAYE before tax credits
 */
function calculatePayeProgressive(taxableIncome) {
  let tax = 0;
  let remaining = taxableIncome;
  let prevUpper = 0;

  for (const bracket of MONTHLY_TAX_BRACKETS) {
    if (remaining <= 0) break;
    const bracketSize = bracket.upper === Infinity ? remaining : bracket.upper - prevUpper;
    const taxableInBracket = Math.min(remaining, bracketSize);
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    }
    prevUpper = bracket.upper;
  }

  return Math.max(0, tax);
}

/**
 * Calculate NSSF contribution
 * @param {number} grossSalary
 * @returns {{ tier1: number, tier2: number, total: number }}
 */
function calculateNSSF(grossSalary) {
  const tier1 = Math.min(grossSalary, NSSF_TIER1_MAX_BASE) * NSSF_TIER1_RATE;
  const tier2Base = Math.min(
    Math.max(0, grossSalary - NSSF_TIER1_MAX_BASE),
    NSSF_TIER2_MAX_BASE - NSSF_TIER1_MAX_BASE
  );
  const tier2 = tier2Base * NSSF_TIER2_RATE;
  return {
    tier1: Math.round(tier1),
    tier2: Math.round(tier2),
    total: Math.round(tier1 + tier2),
  };
}

/**
 * Calculate SHIF (Social Health Insurance Fund)
 * @param {number} grossSalary
 * @returns {number}
 */
function calculateSHIF(grossSalary) {
  return Math.max(SHIF_MIN, Math.round(grossSalary * SHIF_RATE));
}

/**
 * Calculate Housing Levy
 * @param {number} grossSalary
 * @returns {number}
 */
function calculateHousingLevy(grossSalary) {
  return Math.round(grossSalary * HOUSING_LEVY_RATE);
}

/**
 * Main calculator: Full payslip breakdown.
 * @param {Object} opts
 * @param {number} opts.grossSalary - Monthly gross salary
 * @param {Object} [opts.optional]
 */
export function calculatePayslip({
  grossSalary,
  optional = {},
}) {
  const {
    pensionContribution = 0,
    insurancePremium = 0,
    lifeInsurance = 0,
    mortgageInterest = 0,
    hospContribution = 0,
    isDisabled = false,
    otherDeductions = 0,
  } = optional;

  // --- INCOME DEDUCTIONS (reduce taxable income BEFORE PAYE brackets) ---
  const cappedPension = Math.min(Math.max(0, pensionContribution), PENSION_DEDUCTION_CAP);
  const cappedMortgage = Math.min(Math.max(0, mortgageInterest), MORTGAGE_DEDUCTION_CAP);
  const cappedHosp = Math.min(Math.max(0, hospContribution), HOSP_DEDUCTION_CAP);
  const disabilityDeduction = isDisabled ? DISABILITY_DEDUCTION : 0;

  const totalIncomeDeductions = cappedPension + cappedMortgage + cappedHosp + disabilityDeduction;
  const taxableIncome = Math.max(0, grossSalary - totalIncomeDeductions);

  // --- PAYE CALCULATION ---
  const grossTax = calculatePayeProgressive(taxableIncome);

  // Tax CREDITS (reliefs, subtracted from gross tax)
  const totalInsurancePremium = Math.max(0, insurancePremium + lifeInsurance);
  const insuranceRelief = Math.min(
    Math.round(totalInsurancePremium * INSURANCE_RELIEF_RATE),
    INSURANCE_RELIEF_CAP
  );

  const totalTaxCredits = MONTHLY_PERSONAL_RELIEF + insuranceRelief;
  const netPaye = Math.max(0, grossTax - totalTaxCredits);

  // --- STATUTORY DEDUCTIONS ---
  const nssf = calculateNSSF(grossSalary);
  const shif = calculateSHIF(grossSalary);
  const housingLevy = calculateHousingLevy(grossSalary);

  // --- NET SALARY ---
  const totalDeductions =
    nssf.total + shif + housingLevy + netPaye + cappedPension + otherDeductions;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  // Tax savings from income deductions (how much less tax you pay because deductions reduced taxable income)
  const taxWithoutDeductions = calculatePayeProgressive(grossSalary);
  const taxSavingsFromDeductions = Math.round(taxWithoutDeductions - grossTax);

  // Percentage of gross salary you actually keep
  const keepRate = grossSalary > 0
    ? parseFloat(((netSalary / grossSalary) * 100).toFixed(2))
    : 0;

  return {
    grossSalary: Math.round(grossSalary),
    deductions: {
      // PAYE breakdown
      paye: {
        taxableIncome: Math.round(taxableIncome),
        grossTax: Math.round(grossTax),
        personalRelief: MONTHLY_PERSONAL_RELIEF,
        insuranceRelief,
        net: Math.round(netPaye),
      },
      // Income deductions (reduced taxable income before brackets)
      incomeDeductions: {
        pension: cappedPension,
        mortgageInterest: cappedMortgage,
        hosp: cappedHosp,
        disability: disabilityDeduction,
      },
      // Statutory deductions
      nssf,
      shif,
      housingLevy,
      otherDeductions: Math.round(otherDeductions),
    },
    taxSavingsFromDeductions,
    totalStatutory: nssf.total + shif + housingLevy,
    totalDeductions: Math.round(totalDeductions),
    netSalary: Math.round(netSalary),
    keepRate,
  };
}

/**
 * Format KSH currency
 */
export function formatKsh(amount) {
  return `KSH ${Math.round(amount).toLocaleString('en-KE')}`;
}
