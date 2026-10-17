import { DocumentPage, TermItem, AnswerItem, VerificationResult } from "./types";

/**
 * Normalizes text by removing non-alphanumeric noise, standardizing spaces and quotes
 */
export function normalizeForMatching(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds quote in a specific text string (normalizing whitespace and case).
 * Returns offset positions if found.
 */
export function findQuoteInText(
  quote: string,
  text: string
): { found: boolean; startIndex: number; endIndex: number } {
  if (!quote || !text) return { found: false, startIndex: -1, endIndex: -1 };

  const cleanQuote = quote.trim();
  if (cleanQuote.length < 3) return { found: false, startIndex: -1, endIndex: -1 };

  // 1. Exact raw match
  const exactIndex = text.indexOf(cleanQuote);
  if (exactIndex !== -1) {
    return {
      found: true,
      startIndex: exactIndex,
      endIndex: exactIndex + cleanQuote.length,
    };
  }

  // 2. Case-insensitive match
  const lowerText = text.toLowerCase();
  const lowerQuote = cleanQuote.toLowerCase();
  const lowerIndex = lowerText.indexOf(lowerQuote);
  if (lowerIndex !== -1) {
    return {
      found: true,
      startIndex: lowerIndex,
      endIndex: lowerIndex + cleanQuote.length,
    };
  }

  // 3. Normalized whitespace and punctuation match
  const normTarget = normalizeForMatching(cleanQuote);
  const normText = normalizeForMatching(text);
  const normIndex = normText.indexOf(normTarget);
  if (normIndex !== -1) {
    return {
      found: true,
      startIndex: 0,
      endIndex: text.length,
    };
  }

  // 4. Token overlap check (threshold 80%)
  const tokens = normTarget.split(/\s+/).filter((t) => t.length > 2);
  if (tokens.length >= 3) {
    const textTokens = new Set(normText.split(/\s+/));
    const matched = tokens.filter((t) => textTokens.has(t)).length;
    if (matched / tokens.length >= 0.8) {
      return {
        found: true,
        startIndex: 0,
        endIndex: text.length,
      };
    }
  }

  return { found: false, startIndex: -1, endIndex: -1 };
}

/**
 * Verifies if a quote exists within the extracted document pages.
 */
export function verifyQuoteInPages(
  quote: string,
  pages: DocumentPage[]
): VerificationResult {
  if (!quote || quote.trim().length === 0) {
    return { isVerified: false, matchScore: 0, matchedQuote: "" };
  }

  const cleanQuote = quote.trim();
  const normalizedTarget = normalizeForMatching(cleanQuote);

  if (normalizedTarget.length < 5) {
    return { isVerified: false, matchScore: 0, matchedQuote: "" };
  }

  // Check page by page
  for (const page of pages) {
    const match = findQuoteInText(cleanQuote, page.text || "");
    if (match.found) {
      return {
        isVerified: true,
        matchScore: 1.0,
        matchedQuote: cleanQuote,
        pageNumber: page.pageNumber,
        startIndex: match.startIndex,
        endIndex: match.endIndex,
      };
    }
  }

  // Sliding token overlap across all pages
  const quoteTokens = normalizedTarget.split(/\s+/).filter((t) => t.length > 2);
  if (quoteTokens.length === 0) {
    return { isVerified: false, matchScore: 0, matchedQuote: "" };
  }

  let bestScore = 0;
  let bestPage = 1;

  for (const page of pages) {
    const normPage = normalizeForMatching(page.text || "");
    const pageTokens = new Set(normPage.split(/\s+/));
    const foundCount = quoteTokens.filter((token) => pageTokens.has(token)).length;
    const score = foundCount / quoteTokens.length;

    if (score > bestScore) {
      bestScore = score;
      bestPage = page.pageNumber;
    }
  }

  const isVerified = bestScore >= 0.8;

  return {
    isVerified,
    matchScore: Number(bestScore.toFixed(2)),
    matchedQuote: cleanQuote,
    pageNumber: isVerified ? bestPage : undefined,
  };
}

/**
 * Cross-verifies all key terms against the extracted pages in CODE.
 */
export function verifyTerms(
  terms: TermItem[],
  pages: DocumentPage[]
): TermItem[] {
  return terms.map((term) => {
    const result = verifyQuoteInPages(term.quote, pages);
    return {
      ...term,
      verified: result.isVerified,
      page: result.pageNumber ?? term.page ?? 1,
    };
  });
}

/**
 * Cross-verifies answer quotes. If any quote fails verification,
 * the answer status is updated or unverified quotes are marked.
 */
export function verifyAnswer(
  answer: AnswerItem,
  pages: DocumentPage[]
): AnswerItem {
  if (answer.status === "not_found" || !answer.quotes || answer.quotes.length === 0) {
    return answer;
  }

  const verifiedQuotes: string[] = [];

  for (const quote of answer.quotes) {
    const result = verifyQuoteInPages(quote, pages);
    if (result.isVerified) {
      verifiedQuotes.push(quote);
    }
  }

  if (verifiedQuotes.length === 0) {
    return {
      text: "Not found in this agreement. The cited clauses could not be verified in the extracted document text.",
      quotes: [],
      status: "not_found",
    };
  }

  return {
    ...answer,
    quotes: verifiedQuotes,
    status: "answered",
  };
}
