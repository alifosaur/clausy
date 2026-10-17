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

export interface AnswerItem {
  text: string;
  quotes: string[];
  status: "answered" | "not_found";
}

export interface AnalysisResult {
  terms: TermItem[];
  flags: FlagItem[];
}

export interface DocumentPage {
  pageNumber: number;
  text: string;
  imageUrl?: string;
  fileName?: string;
}

export interface FinancialMetrics {
  monthlyRent: number;
  securityDeposit: number;
  depositMultipleOfRent: number;
  noticePeriodMonths: number;
  depositMultipleOfNotice: number;
  lockInMonths: number;
  upfrontTotal: number;
  rawRentString: string;
  rawDepositString: string;
  rawNoticeString: string;
}

export interface VerificationResult {
  isVerified: boolean;
  matchScore: number;
  matchedQuote: string;
  pageNumber?: number;
  startIndex?: number;
  endIndex?: number;
}
