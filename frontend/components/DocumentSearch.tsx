"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, ChevronUp, X } from "lucide-react";
import { SearchMatch, findSearchMatches, SearchablePage } from "@/lib/search";

interface DocumentSearchProps {
  pages: SearchablePage[];
  currentPageNumber: number;
  onSelectMatch: (match: SearchMatch | null) => void;
  onMatchesFound?: (matches: SearchMatch[]) => void;
}

export function DocumentSearch({
  pages,
  currentPageNumber,
  onSelectMatch,
  onMatchesFound,
}: DocumentSearchProps) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-run search whenever query or pages change
  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      setCurrentIndex(0);
      onSelectMatch(null);
      if (onMatchesFound) onMatchesFound([]);
      return;
    }

    const foundMatches = findSearchMatches(query, pages);
    setMatches(foundMatches);
    if (onMatchesFound) onMatchesFound(foundMatches);

    if (foundMatches.length > 0) {
      // Find match closest to or on current page if possible, otherwise index 0
      const currentMatchOnPage = foundMatches.findIndex(
        (m) => m.pageNumber === currentPageNumber
      );
      const newIndex = currentMatchOnPage >= 0 ? currentMatchOnPage : 0;
      setCurrentIndex(newIndex);
      onSelectMatch(foundMatches[newIndex]);
    } else {
      setCurrentIndex(0);
      onSelectMatch(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pages]);

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIdx);
    onSelectMatch(matches[nextIdx]);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIdx);
    onSelectMatch(matches[prevIdx]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
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
    onSelectMatch(null);
    if (onMatchesFound) onMatchesFound([]);
    inputRef.current?.focus();
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div
      role="search"
      aria-label="Find in document"
      className="flex items-center justify-between gap-2 px-3 py-2 bg-paper-50 border border-paper-border rounded-xl shadow-paper transition-all focus-within:ring-2 focus-within:ring-ink focus-within:border-transparent mb-3"
    >
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
          placeholder="Find in document (Enter for next, Shift+Enter for prev)..."
          className="w-full bg-transparent text-xs font-sans text-ink placeholder:text-ink-muted/70 focus:outline-none"
        />
        {hasQuery && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="p-1 rounded-md text-ink-muted hover:text-ink transition-colors flex-shrink-0"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Match status counter & navigation */}
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
      </div>
    </div>
  );
}
