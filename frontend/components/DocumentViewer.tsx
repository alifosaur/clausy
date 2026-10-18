"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocumentPage } from "@/lib/types";
import { findQuoteInText } from "@/lib/verifier";
import { SearchMatch } from "@/lib/search";
import {
  FileText,
  Image as ImageIcon,
  RotateCw,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Edit3,
  Eye,
} from "lucide-react";

interface DocumentViewerProps {
  pages: DocumentPage[];
  currentPageNumber: number;
  onPageChange: (pageNumber: number) => void;
  onUpdatePageText: (pageNumber: number, newText: string) => void;
  onReanalyze: () => void;
  activeQuote?: string;
  activeSearchMatch?: SearchMatch | null;
  searchMatches?: SearchMatch[];
  isReanalyzing?: boolean;
}

export function DocumentViewer({
  pages,
  currentPageNumber,
  onPageChange,
  onUpdatePageText,
  onReanalyze,
  activeQuote,
  activeSearchMatch,
  searchMatches = [],
  isReanalyzing = false,
}: DocumentViewerProps) {
  // Switch between "Pages" view and "Extracted text" view
  const [viewMode, setViewMode] = useState<"pages" | "text">("pages");
  const [isZoomed, setIsZoomed] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isEditingText, setIsEditingText] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const highlightRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPage =
    pages.find((p) => p.pageNumber === currentPageNumber) || pages[0];

  // Sync editedText whenever page changes
  useEffect(() => {
    if (currentPage) {
      setEditedText(currentPage.text);
      setHasUnsavedChanges(false);
    }
  }, [currentPage]);

  // When a search match is selected, switch to Extracted Text view and preview mode
  useEffect(() => {
    if (activeSearchMatch) {
      setViewMode("text");
      setIsEditingText(false);
    }
  }, [activeSearchMatch]);

  // Check if active quote matches current page text
  const quoteMatch =
    activeQuote && currentPage
      ? findQuoteInText(activeQuote, currentPage.text)
      : { found: false, startIndex: -1, endIndex: -1 };

  // GSAP marker wipe animation and scroll into view when match or quote changes
  useEffect(() => {
    if (!highlightRef.current) return;
    const isSearchMatchActive = Boolean(
      activeSearchMatch && activeSearchMatch.pageNumber === currentPageNumber
    );
    const isQuoteActive = Boolean(activeQuote && quoteMatch.found);

    if (!isSearchMatchActive && !isQuoteActive) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      import("gsap").then(({ default: gsap }) => {
        if (!highlightRef.current) return;
        gsap.fromTo(
          highlightRef.current,
          {
            backgroundSize: "0% 100%",
          },
          {
            backgroundSize: "100% 100%",
            duration: 0.55,
            ease: "power2.out",
          }
        );
      });
    }

    // Smoothly scroll highlight into view within container
    highlightRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [
    activeQuote,
    quoteMatch.found,
    activeSearchMatch,
    currentPageNumber,
    viewMode,
    isEditingText,
  ]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleReanalyzeClick = () => {
    if (currentPage) {
      onUpdatePageText(currentPage.pageNumber, editedText);
      setHasUnsavedChanges(false);
    }
    setIsEditingText(false);
    onReanalyze();
  };

  /**
   * Renders text with animated highlighter mark for active search match or active quote.
   */
  const renderHighlightedContent = (text: string, isMonospace = false) => {
    const isSearchOnCurrentPage = Boolean(
      activeSearchMatch && activeSearchMatch.pageNumber === currentPage?.pageNumber
    );

    // 1. Search Matches take precedence if active on this page
    if (isSearchOnCurrentPage && activeSearchMatch) {
      const pageMatches = searchMatches
        .filter((m) => m.pageNumber === currentPage?.pageNumber)
        .sort((a, b) => a.startIndex - b.startIndex);

      const matchesToRender = pageMatches.length > 0 ? pageMatches : [activeSearchMatch];
      const nodes: React.ReactNode[] = [];
      let lastIndex = 0;

      for (let i = 0; i < matchesToRender.length; i++) {
        const m = matchesToRender[i];
        if (m.startIndex > lastIndex) {
          nodes.push(text.substring(lastIndex, m.startIndex));
        }

        const isCurrentMatch =
          m.startIndex === activeSearchMatch.startIndex &&
          m.endIndex === activeSearchMatch.endIndex;

        nodes.push(
          <mark
            key={`match-${m.startIndex}-${m.endIndex}-${i}`}
            ref={isCurrentMatch ? highlightRef : undefined}
            className={
              isCurrentMatch
                ? "bg-transparent bg-gradient-to-r from-highlighter-solid to-highlighter-solid bg-no-repeat text-ink font-semibold px-1 py-0.5 rounded inline shadow-sm border border-highlighter-accent/40"
                : "bg-highlighter-solid/40 text-ink font-medium px-0.5 py-0.5 rounded inline"
            }
            style={isCurrentMatch ? { backgroundSize: "100% 100%" } : undefined}
            title={isCurrentMatch ? "Current search match" : "Search match"}
          >
            {text.substring(m.startIndex, m.endIndex)}
          </mark>
        );

        lastIndex = m.endIndex;
      }

      if (lastIndex < text.length) {
        nodes.push(text.substring(lastIndex));
      }

      return (
        <div
          className={`whitespace-pre-wrap leading-relaxed text-ink/90 ${
            isMonospace ? "font-mono text-xs sm:text-sm" : "font-sans text-xs sm:text-sm"
          }`}
        >
          {nodes}
        </div>
      );
    }

    // 2. Active Quote Highlight
    if (activeQuote && quoteMatch.found && quoteMatch.startIndex !== -1) {
      const before = text.substring(0, quoteMatch.startIndex);
      const matched = text.substring(quoteMatch.startIndex, quoteMatch.endIndex);
      const after = text.substring(quoteMatch.endIndex);

      return (
        <div
          className={`whitespace-pre-wrap leading-relaxed text-ink/90 ${
            isMonospace ? "font-mono text-xs sm:text-sm" : "font-sans text-xs sm:text-sm"
          }`}
        >
          {before}
          <mark
            ref={highlightRef}
            className="bg-transparent bg-gradient-to-r from-highlighter-solid to-highlighter-solid bg-no-repeat text-ink font-semibold px-1 py-0.5 rounded inline shadow-sm border border-highlighter-accent/40"
            style={{
              backgroundSize: "100% 100%",
            }}
            title="Cited clause"
          >
            {matched}
          </mark>
          {after}
        </div>
      );
    }

    // 3. Fallback: unhighlighted text
    return (
      <div
        className={`whitespace-pre-wrap leading-relaxed text-ink/90 ${
          isMonospace ? "font-mono text-xs sm:text-sm" : "font-sans text-xs sm:text-sm"
        }`}
      >
        {text}
      </div>
    );
  };

  if (!currentPage) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-paper-50 rounded-2xl border border-paper-border text-ink-muted">
        No document page selected.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-paper-50 border border-paper-border rounded-2xl shadow-paper overflow-hidden"
    >
      {/* Document Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 border-b border-paper-border bg-paper-100">
        {/* View Mode Toggle: Pages view vs Extracted text view */}
        <div
          role="tablist"
          aria-label="Document view options"
          className="inline-flex rounded-xl p-1 bg-paper-200 border border-paper-border"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "pages"}
            onClick={() => setViewMode("pages")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "pages"
                ? "bg-paper-50 text-ink shadow-sm font-semibold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Pages
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "text"}
            onClick={() => setViewMode("text")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "text"
                ? "bg-paper-50 text-ink shadow-sm font-semibold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Extracted Text
          </button>
        </div>

        {/* Page Selector & Re-analyze action */}
        <div className="flex items-center gap-2">
          {/* Thumbnail / Page Pills */}
          <div className="flex items-center gap-1 text-xs font-medium text-ink-muted bg-paper-200 px-2 py-1 rounded-lg border border-paper-border">
            <span className="hidden sm:inline">Page:</span>
            <div className="flex gap-1" role="group" aria-label="Page selection">
              {pages.map((p) => (
                <button
                  key={p.pageNumber}
                  type="button"
                  onClick={() => onPageChange(p.pageNumber)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    p.pageNumber === currentPageNumber
                      ? "bg-ink text-paper font-semibold"
                      : "hover:bg-paper-300 text-ink font-medium"
                  }`}
                  aria-label={`Go to page ${p.pageNumber}`}
                  aria-current={p.pageNumber === currentPageNumber ? "page" : undefined}
                >
                  {p.pageNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Re-analyze button in top bar */}
          <button
            type="button"
            onClick={handleReanalyzeClick}
            disabled={isReanalyzing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-ink ${
              hasUnsavedChanges
                ? "bg-ink text-paper hover:bg-ink-deep font-semibold shadow-sm"
                : "bg-paper-200 border border-paper-border text-ink hover:bg-paper-300"
            }`}
            title="Re-run verification and recalculate Key Terms and Money Card"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReanalyzing ? "animate-spin" : ""}`} />
            <span>Re-analyze</span>
          </button>
        </div>
      </div>

      {/* Active Search Match Banner */}
      {activeSearchMatch && activeSearchMatch.pageNumber === currentPage.pageNumber && (
        <div className="px-4 py-2 border-b border-paper-border text-xs flex items-center justify-between gap-2 bg-highlighter-solid/40 text-ink">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-ink flex-shrink-0" />
            <span className="font-medium text-ink truncate">
              Search match on Page {currentPage.pageNumber}: &quot;{activeSearchMatch.matchedText}&quot;
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-highlighter-solid text-ink font-semibold border border-highlighter-accent/50 flex-shrink-0">
            <ShieldCheck className="w-3 h-3" />
            Match Found
          </span>
        </div>
      )}

      {/* Active Quote Banner: shows Verified or Unverified badge (when no search active) */}
      {!activeSearchMatch && activeQuote && (
        <div
          className={`px-4 py-2 border-b border-paper-border text-xs flex items-center justify-between gap-2 transition-colors ${
            quoteMatch.found
              ? "bg-highlighter-solid/40 text-ink"
              : "bg-paper-200 text-ink-muted"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {quoteMatch.found ? (
              <Sparkles className="w-3.5 h-3.5 text-ink flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
            )}
            <span className="font-medium text-ink truncate">
              {quoteMatch.found
                ? `Highlighted quote on Page ${currentPage.pageNumber}: "${activeQuote.slice(0, 60)}..."`
                : `Quote not found in current page text: "${activeQuote.slice(0, 50)}..."`}
            </span>
          </div>

          {quoteMatch.found ? (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-highlighter-solid text-ink font-semibold border border-highlighter-accent/50 flex-shrink-0">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-paper-100 text-ink-muted font-medium border border-paper-border flex-shrink-0">
              <AlertCircle className="w-3 h-3" />
              Unverified
            </span>
          )}
        </div>
      )}

      {/* Main Document Viewer Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-paper-50">
        {viewMode === "text" ? (
          /* Extracted Text View: Highlighted Preview OR Editable Textarea */
          <div className="flex flex-col h-full gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <div>
                <span className="text-xs font-semibold text-ink">
                  Page {currentPage.pageNumber} Extracted Text
                </span>
                <p className="text-[11px] text-ink-muted font-sans">
                  {isEditingText
                    ? "Edit or correct OCR errors below, then click Re-analyze."
                    : "Extracted verbatim text with cited clause and search highlights."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Unsaved edits
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingText(!isEditingText)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-paper-200 hover:bg-paper-300 text-ink border border-paper-border transition-colors focus-visible:ring-1 focus-visible:ring-ink"
                  aria-label={isEditingText ? "Switch to formatted highlight view" : "Edit extracted OCR text"}
                >
                  {isEditingText ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Highlights</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isEditingText ? (
              <textarea
                id="extracted-text-area"
                value={editedText}
                onChange={handleTextChange}
                rows={18}
                className="w-full flex-1 min-h-[380px] p-4 font-mono text-xs sm:text-sm leading-relaxed bg-paper-100 border border-paper-border rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent resize-y selection:bg-highlighter-solid selection:text-ink"
                placeholder="Paste or edit agreement text here..."
              />
            ) : (
              <div className="w-full flex-1 min-h-[380px] p-4 sm:p-5 bg-paper-100 border border-paper-border rounded-xl overflow-y-auto selection:bg-highlighter-solid selection:text-ink">
                {renderHighlightedContent(editedText || currentPage.text, true)}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-ink-muted">
                {(editedText || currentPage.text).length} characters · Page {currentPage.pageNumber} of {pages.length}
              </span>

              <div className="flex gap-2">
                {hasUnsavedChanges && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedText(currentPage.text);
                      setHasUnsavedChanges(false);
                    }}
                    className="px-3 py-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReanalyzeClick}
                  disabled={isReanalyzing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-paper text-xs font-medium hover:bg-ink-deep disabled:opacity-50 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isReanalyzing ? "animate-spin" : ""}`} />
                  <span>Re-analyze Document</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Pages View: Real uploaded agreement images */
          <div className="flex flex-col items-center justify-center min-h-[480px]">
            <div className="w-full max-w-2xl flex flex-col items-center">
              {/* Mandatory Upload Hint */}
              <div className="w-full mb-3 px-3.5 py-2 rounded-xl bg-paper-100 border border-paper-border text-xs text-ink-muted flex items-center justify-between gap-2">
                <span className="leading-tight">
                  Compare the quote with your page. Text is read by AI and can contain mistakes.
                </span>
                {currentPage.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-paper-200 hover:bg-paper-300 text-ink border border-paper-border transition-colors flex-shrink-0"
                  >
                    {isZoomed ? "Zoom Out" : "Zoom In"}
                  </button>
                )}
              </div>

              {currentPage.imageUrl ? (
                <div
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`w-full bg-paper-100 p-2 rounded-xl border border-paper-border shadow-paper transition-all overflow-hidden ${
                    isZoomed ? "cursor-zoom-out ring-2 ring-ink" : "cursor-zoom-in"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentPage.imageUrl}
                    alt={`Agreement page ${currentPage.pageNumber}: ${currentPage.fileName || "Uploaded document scan"}`}
                    className={`w-full h-auto rounded-lg object-contain border border-paper-border-dark/20 transition-transform duration-200 ${
                      isZoomed ? "scale-125 origin-top my-4" : ""
                    }`}
                  />
                  <div className="mt-2 px-2 py-1 flex items-center justify-between text-[11px] font-mono text-ink-muted">
                    <span>{currentPage.fileName || `Page ${currentPage.pageNumber}`}</span>
                    <span>Click image to {isZoomed ? "zoom out" : "zoom in"}</span>
                  </div>
                </div>
              ) : (
                <div className="w-full p-12 text-center bg-paper-100 rounded-xl border border-paper-border text-ink-muted space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto text-ink-muted/50" />
                  <h3 className="font-serif text-lg text-ink">Page {currentPage.pageNumber}</h3>
                  <p className="text-xs text-ink-muted">Uploaded document scan</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
