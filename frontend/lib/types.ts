/**
 * Clausy Data Contract Types
 * Strictly conforms to PROJECT_RULES.md:
 * { "terms": [{ "key","label","value","quote","page","verified": boolean }],
 *   "flags": [{ "title","reason","quotes": [string], "question": string }],
 *   "answer": { "text","quotes": [string],"status":"answered|not_found" } }
 */

export interface TermItem {
  key: "rent" | "deposit" | "lock_in" | "notice_period" | "penalties" | "maintenance" | string;
  label: string;
  value: string;
  quote: string;
  page: number;
  verified: boolean;
}

export interface FlagItem {
  title: string;
  reason: string;
  quotes: string[];
  question: string;
}

export type AnswerStatus = "answered" | "not_found";

export interface AnswerItem {
  text: string;
  quotes: string[];
  status: AnswerStatus;
}

export interface DocumentPage {
  page?: number;
  pageNumber: number;
  text: string;
  imageUrl?: string;
  fileName?: string;
}

export interface ExtractResponse {
  terms: TermItem[];
  flags: FlagItem[];
  pages?: DocumentPage[];
  rawText?: string;
  extracted_text?: string;
}

export interface AskResponse extends AnswerItem {
  pageNumber?: number;
}

export interface HealthResponse {
  status: "ok" | "healthy" | "degraded" | string;
  service?: string;
  gemmaReady?: boolean;
  version?: string;
  timestamp?: string;
}

export interface FinancialMetrics {
  monthlyRent: number;
  securityDeposit: number;
  depositMultipleOfRent: number;
  noticePeriodMonths: number;
  depositMultipleOfNotice: number;
  lockInMonths: number;
  upfrontTotal: number;
  rawRentString?: string;
  rawDepositString?: string;
  rawNoticeString?: string;
}

export interface VerificationResult {
  isVerified: boolean;
  matchScore: number;
  matchedQuote: string;
  pageNumber?: number;
  startIndex?: number;
  endIndex?: number;
}

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
