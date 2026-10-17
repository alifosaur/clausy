import { TermItem } from "./types";

export interface MoneyCardMetrics {
  isValid: boolean;
  errorMessage?: string;
  monthlyRent: number;
  securityDeposit: number;
  depositMultipleOfRent: number;
  noticePeriodMonths: number;
  depositMultipleOfNotice: number;
  lockInMonths: number;
  upfrontTotal: number;
  formattedRent: string;
  formattedDeposit: string;
  formattedUpfront: string;
  note: string;
}

export const MONEY_CARD_NOTE = "Confirm the refund timeline and permitted deductions";

/**
 * Extracts numeric value from currency strings like "₹18,000", "Rs. 18,000/-", "90000"
 */
export function parseCurrencyAmount(rawStr?: string): number | null {
  if (!rawStr || typeof rawStr !== "string") return null;

  // Extract digits and commas
  const cleaned = rawStr.replace(/[^\d.]/g, "");
  if (!cleaned) return null;

  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Parses duration in months from strings like "2 months", "6 (six) months", "60 days"
 */
export function parseDurationMonths(rawStr?: string): number | null {
  if (!rawStr || typeof rawStr !== "string") return null;
  const lower = rawStr.toLowerCase();

  // Days match
  const daysMatch = lower.match(/(\d+)\s*(?:day|days)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return Math.max(1, Math.round(days / 30));
  }

  // Months match
  const monthsMatch = lower.match(/(\d+)\s*(?:month|months)/);
  if (monthsMatch) {
    return parseInt(monthsMatch[1], 10);
  }

  // First standalone number
  const numMatch = lower.match(/\b\d+\b/);
  if (numMatch) {
    return parseInt(numMatch[0], 10);
  }

  return null;
}

/**
 * Computes deterministic financial ratios in CODE.
 * If parsing fails, returns error with message: "Can't calculate from this text"
 */
export function computeMoneyCard(terms: TermItem[]): MoneyCardMetrics {
  const rentTerm = terms.find((t) => t.key === "rent");
  const depositTerm = terms.find((t) => t.key === "deposit");
  const noticeTerm = terms.find((t) => t.key === "notice_period");
  const lockInTerm = terms.find((t) => t.key === "lock_in");

  const monthlyRent = parseCurrencyAmount(rentTerm?.value);
  const securityDeposit = parseCurrencyAmount(depositTerm?.value);
  const noticeMonths = parseDurationMonths(noticeTerm?.value);
  const lockInMonths = parseDurationMonths(lockInTerm?.value) || 6;

  // If rent or deposit cannot be parsed
  if (!monthlyRent || !securityDeposit) {
    return {
      isValid: false,
      errorMessage: "Can't calculate from this text",
      monthlyRent: 0,
      securityDeposit: 0,
      depositMultipleOfRent: 0,
      noticePeriodMonths: 0,
      depositMultipleOfNotice: 0,
      lockInMonths: 0,
      upfrontTotal: 0,
      formattedRent: "-",
      formattedDeposit: "-",
      formattedUpfront: "-",
      note: MONEY_CARD_NOTE,
    };
  }

  const effectiveNoticeMonths = noticeMonths && noticeMonths > 0 ? noticeMonths : 1;

  // Multiples calculated strictly in software code
  const depositMultipleOfRent = Number((securityDeposit / monthlyRent).toFixed(1));
  const depositMultipleOfNotice = Number(
    (securityDeposit / (monthlyRent * effectiveNoticeMonths)).toFixed(1)
  );
  const upfrontTotal = securityDeposit + monthlyRent;

  return {
    isValid: true,
    monthlyRent,
    securityDeposit,
    depositMultipleOfRent,
    noticePeriodMonths: effectiveNoticeMonths,
    depositMultipleOfNotice,
    lockInMonths,
    upfrontTotal,
    formattedRent: `₹${monthlyRent.toLocaleString("en-IN")}`,
    formattedDeposit: `₹${securityDeposit.toLocaleString("en-IN")}`,
    formattedUpfront: `₹${upfrontTotal.toLocaleString("en-IN")}`,
    note: MONEY_CARD_NOTE,
  };
}
