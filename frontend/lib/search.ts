/**
 * Find in Document search module for Clausy extracted text.
 * Finds whole or partial word matches across document pages.
 * Never searches translated text (operates strictly on original extracted text).
 */

export interface TextMatch {
  startIndex: number;
  endIndex: number;
  matchedText: string;
}

export interface SearchMatch {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
  matchedText: string;
}

export interface SearchablePage {
  pageNumber: number;
  text: string;
}

/**
 * Escapes regex special characters for literal search.
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds all case-insensitive whole or partial matches of query in a single text string.
 * Returns character start and end indices.
 */
export function findMatchesInText(query: string, text: string): TextMatch[] {
  if (!query || !query.trim() || !text) {
    return [];
  }

  const trimmedQuery = query.trim();
  const escaped = escapeRegExp(trimmedQuery);
  const regex = new RegExp(escaped, "gi");

  const matches: TextMatch[] = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    matches.push({
      startIndex: m.index,
      endIndex: m.index + m[0].length,
      matchedText: m[0],
    });

    // Guard against 0-length infinite loops
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  return matches;
}

/**
 * Finds all matches across multiple pages of extracted text.
 * Returns matches with page numbers and character offsets within each page.
 * Results are ordered by page number, then by occurrence offset.
 */
export function findSearchMatches(
  query: string,
  pages: SearchablePage[]
): SearchMatch[] {
  if (!query || !query.trim() || !pages || pages.length === 0) {
    return [];
  }

  const results: SearchMatch[] = [];

  for (const page of pages) {
    if (!page.text) continue;
    const textMatches = findMatchesInText(query, page.text);
    for (const tm of textMatches) {
      results.push({
        pageNumber: page.pageNumber,
        startIndex: tm.startIndex,
        endIndex: tm.endIndex,
        matchedText: tm.matchedText,
      });
    }
  }

  return results;
}
