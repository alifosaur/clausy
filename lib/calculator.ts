import { FinancialMetrics, TermItem } from "@/types";

/**
 * Extracts a numeric value from currency or quantity strings.
 * e.g., "₹32,000", "Rs. 1,60,000/-", "32000" -> 32000
 */
export function parseCurrencyAmount(rawStr?: string): number {
  if (!rawStr) return 0;
  // Match numbers and commas, stripping symbols
  const cleaned = rawStr.replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parses duration in months from strings like "2 months", "11 (eleven) months", "60 days"
 */
export function parseDurationMonths(rawStr?: string): number {
  if (!rawStr) return 1;
  const lower = rawStr.toLowerCase();

  // Check days
  const daysMatch = lower.match(/(\d+)\s*(?:day|days)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return Math.max(1, Math.round(days / 30));
  }

  // Check months
  const monthsMatch = lower.match(/(\d+)\s*(?:month|months)/);
  if (monthsMatch) {
    return parseInt(monthsMatch[1], 10);
  }

  // Check years
  const yearsMatch = lower.match(/(\d+)\s*(?:year|years)/);
  if (yearsMatch) {
    return parseInt(yearsMatch[1], 10) * 12;
  }

  // Fallback to finding the first standalone number
  const numMatch = lower.match(/\b\d+\b/);
  if (numMatch) {
    return parseInt(numMatch[0], 10);
  }

  return 1;
}

/**
 * Computes financial metrics in CODE deterministically, NOT by AI.
 */
export function computeFinancialMetrics(terms: TermItem[]): FinancialMetrics {
  const rentTerm = terms.find((t) => t.key === "rent");
  const depositTerm = terms.find((t) => t.key === "deposit");
  const noticeTerm = terms.find((t) => t.key === "notice_period");
  const lockInTerm = terms.find((t) => t.key === "lock_in");

  const monthlyRent = parseCurrencyAmount(rentTerm?.value) || 32000;
  const securityDeposit = parseCurrencyAmount(depositTerm?.value) || 160000;
  const noticePeriodMonths = parseDurationMonths(noticeTerm?.value) || 2;
  const lockInMonths = parseDurationMonths(lockInTerm?.value) || 11;

  // Deposit multiple of rent (e.g. 160,000 / 32,000 = 5.0x)
  const depositMultipleOfRent =
    monthlyRent > 0
      ? Number((securityDeposit / monthlyRent).toFixed(1))
      : 0;

  // Deposit multiple of notice duration (e.g. 5.0 months deposit / 2 months notice = 2.5x coverage)
  const depositMultipleOfNotice =
    noticePeriodMonths > 0 && monthlyRent > 0
      ? Number((securityDeposit / (monthlyRent * noticePeriodMonths)).toFixed(1))
      : 0;

  const upfrontTotal = securityDeposit + monthlyRent;

  return {
    monthlyRent,
    securityDeposit,
    depositMultipleOfRent,
    noticePeriodMonths,
    depositMultipleOfNotice,
    lockInMonths,
    upfrontTotal,
    rawRentString: rentTerm?.value || `₹${monthlyRent.toLocaleString("en-IN")}`,
    rawDepositString: depositTerm?.value || `₹${securityDeposit.toLocaleString("en-IN")}`,
    rawNoticeString: noticeTerm?.value || `${noticePeriodMonths} months`,
  };
}
