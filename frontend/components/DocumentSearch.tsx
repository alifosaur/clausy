"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, ChevronUp, X, ArrowUp } from "lucide-react";
import { SearchMatch, findSearchMatches, SearchablePage } from "@/lib/search";

export interface DocumentSearchProps {
  pages: SearchablePage[];
  currentPageNumber: number;
  onNavigateToMatch: (match: SearchMatch) => void;
  onMatchesChange?: (matches: SearchMatch[]) => void;
  onClearSearch: () => void;
  onBackToTop?: () => void;
}

export function DocumentSearch({
  pages,
  currentPageNumber,
  onNavigateToMatch,
  onMatchesChange,
  onClearSearch,
  onBackToTop,
}: DocumentSearchProps) {
  const [query, setQuery] = useState("");
  const [matchPartOfWord, setMatchPartOfWord] = useState(false);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stable string key of pages content to prevent unnecessary re-computations
  const pagesKey = pages.map((p) => `${p.pageNumber}:${p.text?.length || 0}`).join(",");

  // Update matches when query, toggle, or page content changes
  // NOTE: Typing updates match count but NEVER triggers scrolling!
  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      setCurrentIndex(0);
      onClearSearch();
      onMatchesChange?.([]);
      return;
    }

    const foundMatches = findSearchMatches(query, pages, {
      wholeWord: !matchPartOfWord,
    });
    setMatches(foundMatches);
    onMatchesChange?.(foundMatches);

    // Keep active index in bounds or on current page if possible
    if (foundMatches.length > 0) {
      const matchOnCurrentPage = foundMatches.findIndex(
        (m) => m.pageNumber === currentPageNumber
      );
      setCurrentIndex(matchOnCurrentPage >= 0 ? matchOnCurrentPage : 0);
    } else {
      setCurrentIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, matchPartOfWord, pagesKey, currentPageNumber]);

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIdx);
    onNavigateToMatch(matches[nextIdx]);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIdx);
    onNavigateToMatch(matches[prevIdx]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (matches.length > 0) {
        if (e.shiftKey) {
          handlePrev();
        } else {
          // If first time pressing Enter after typing, go to current index match
          handleNext();
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClear();
    }
  };

  const handleClear = () => {
    setQuery("");
    setMatches([]);
    setCurrentIndex(0);
    onClearSearch();
    onMatchesChange?.([]);
    inputRef.current?.focus();
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div
      role="search"
      aria-label="Find in document"
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-paper-50 border border-paper-border rounded-xl shadow-paper transition-all focus-within:ring-2 focus-within:ring-ink focus-within:border-transparent">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-ink-muted flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            role="searchbox"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Find in document"
            placeholder="Find in document (Enter next, Shift+Enter prev, Esc clear)..."
            className="w-full bg-transparent text-xs font-sans text-ink placeholder:text-ink-muted/70 focus:outline-none"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search and reset"
              className="p-1 rounded-md text-ink-muted hover:text-ink transition-colors flex-shrink-0"
              title="Clear search (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Match status counter & navigation controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasQuery && matches.length === 0 && (
            <span
              role="status"
              aria-live="polite"
              className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
            >
              No matches
            </span>
          )}

          {matches.length > 0 && (
            <span
              role="status"
              aria-live="polite"
              className="text-[11px] font-mono text-ink bg-paper-200 px-2 py-0.5 rounded font-medium border border-paper-border"
            >
              {currentIndex + 1} of {matches.length}
            </span>
          )}

          <div className="flex items-center gap-0.5" role="group" aria-label="Search navigation">
            <button
              type="button"
              onClick={handlePrev}
              disabled={matches.length === 0}
              aria-label="Previous match"
              title="Previous match (Shift+Enter)"
              className="p-1 rounded text-ink hover:bg-paper-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus-visible:ring-1 focus-visible:ring-ink"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={matches.length === 0}
              aria-label="Next match"
              title="Next match (Enter)"
              className="p-1 rounded text-ink hover:bg-paper-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus-visible:ring-1 focus-visible:ring-ink"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Back to top button */}
          {onBackToTop && (
            <button
              type="button"
              onClick={onBackToTop}
              aria-label="Back to top of document"
              title="Back to top"
              className="p-1 ml-0.5 rounded text-ink-muted hover:text-ink hover:bg-paper-200 transition-colors focus-visible:ring-1 focus-visible:ring-ink border-l border-paper-border pl-1.5"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Whole-word toggle: Match part of word */}
      <div className="flex items-center justify-between px-1 text-[11px] text-ink-muted">
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-ink">
          <input
            type="checkbox"
            checked={matchPartOfWord}
            onChange={(e) => setMatchPartOfWord(e.target.checked)}
            className="w-3 h-3 rounded border-paper-border text-ink focus:ring-1 focus:ring-ink cursor-pointer accent-ink"
          />
          <span>Match part of word</span>
        </label>
        <span className="font-mono text-[10px] text-ink-muted/70">
          {!matchPartOfWord ? "Whole word only" : "Partial matches allowed"}
        </span>
      </div>
    </div>
  );
}
