import { DocumentPage, TermItem, AnswerItem, VerificationResult } from "@/types";

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
 * Verifies if a quote exists within the extracted document text.
 * Runs exact, normalized, and fuzzy token-overlap checks.
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

  // 1. Check page by page for exact or normalized substring match
  for (const page of pages) {
    const rawPageText = page.text || "";

    // Exact raw match
    const exactIndex = rawPageText.indexOf(cleanQuote);
    if (exactIndex !== -1) {
      return {
        isVerified: true,
        matchScore: 1.0,
        matchedQuote: cleanQuote,
        pageNumber: page.pageNumber,
        startIndex: exactIndex,
        endIndex: exactIndex + cleanQuote.length,
      };
    }

    // Normalized match
    const normalizedPage = normalizeForMatching(rawPageText);
    const normIndex = normalizedPage.indexOf(normalizedTarget);
    if (normIndex !== -1) {
      // Find approximate offset in original text
      return {
        isVerified: true,
        matchScore: 0.98,
        matchedQuote: cleanQuote,
        pageNumber: page.pageNumber,
      };
    }
  }

  // 2. Token overlap / Sliding window matching across combined text
  const quoteTokens = normalizedTarget.split(/\s+/).filter((t) => t.length > 2);
  if (quoteTokens.length === 0) {
    return { isVerified: false, matchScore: 0, matchedQuote: "" };
  }

  let bestScore = 0;
  let bestPage = 1;

  for (const page of pages) {
    const normPage = normalizeForMatching(page.text || "");
    const pageTokens = normPage.split(/\s+/);
    const pageTokenSet = new Set(pageTokens);

    let foundCount = 0;
    for (const token of quoteTokens) {
      if (pageTokenSet.has(token)) {
        foundCount++;
      }
    }

    const overlapScore = foundCount / quoteTokens.length;
    if (overlapScore > bestScore) {
      bestScore = overlapScore;
      bestPage = page.pageNumber;
    }
  }

  // Strict verification threshold: at least 82% token overlap
  const isVerified = bestScore >= 0.82;

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

  // If none of the cited quotes exist in the document, refuse the answer
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
