"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocumentPage } from "@/types";
import { FileText, Image as ImageIcon, Edit3, RotateCw, Check, Sparkles } from "lucide-react";
import gsap from "gsap";

interface DocumentViewerProps {
  pages: DocumentPage[];
  currentPageNumber: number;
  onPageChange: (pageNumber: number) => void;
  onUpdatePageText: (pageNumber: number, newText: string) => void;
  onReanalyze: () => void;
  activeQuote?: string;
  isReanalyzing?: boolean;
}

export function DocumentViewer({
  pages,
  currentPageNumber,
  onPageChange,
  onUpdatePageText,
  onReanalyze,
  activeQuote,
  isReanalyzing = false,
}: DocumentViewerProps) {
  const [viewMode, setViewMode] = useState<"image" | "text">("text");
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const highlightRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPage = pages.find((p) => p.pageNumber === currentPageNumber) || pages[0];

  useEffect(() => {
    if (currentPage) {
      setEditedText(currentPage.text);
      setIsEditing(false);
    }
  }, [currentPage]);

  // GSAP marker wipe animation when activeQuote changes
  useEffect(() => {
    if (!activeQuote || !highlightRef.current) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      highlightRef.current,
      {
        backgroundSize: "0% 100%",
      },
      {
        backgroundSize: "100% 100%",
        duration: 0.6,
        ease: "power2.out",
      }
    );

    // Smoothly scroll highlight into view within container
    highlightRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeQuote, viewMode, currentPageNumber]);

  const handleSaveAndReanalyze = () => {
    if (currentPage) {
      onUpdatePageText(currentPage.pageNumber, editedText);
    }
    setIsEditing(false);
    onReanalyze();
  };

  /**
   * Splits page text to highlight the activeQuote with signature marker style
   */
  const renderHighlightedText = (text: string, quote?: string) => {
    if (!quote || !quote.trim()) {
      return <span className="whitespace-pre-wrap">{text}</span>;
    }

    const cleanQuote = quote.trim();
    const index = text.indexOf(cleanQuote);

    if (index === -1) {
      // Fallback: check case-insensitive match
      const lowerText = text.toLowerCase();
      const lowerQuote = cleanQuote.toLowerCase();
      const lowerIndex = lowerText.indexOf(lowerQuote);

      if (lowerIndex === -1) {
        return <span className="whitespace-pre-wrap">{text}</span>;
      }

      const before = text.substring(0, lowerIndex);
      const match = text.substring(lowerIndex, lowerIndex + cleanQuote.length);
      const after = text.substring(lowerIndex + cleanQuote.length);

      return (
        <span className="whitespace-pre-wrap">
          {before}
          <span
            ref={highlightRef}
            className="marker-stroke-active text-ink font-medium animate-marker"
            title="Cited clause"
          >
            {match}
          </span>
          {after}
        </span>
      );
    }

    const before = text.substring(0, index);
    const match = text.substring(index, index + cleanQuote.length);
    const after = text.substring(index + cleanQuote.length);

    return (
      <span className="whitespace-pre-wrap">
        {before}
        <span
          ref={highlightRef}
          className="marker-stroke-active text-ink font-medium animate-marker"
          title="Cited clause"
        >
          {match}
        </span>
        {after}
      </span>
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-paper-border bg-paper-100">
        {/* Toggle Mode */}
        <div
          role="tablist"
          aria-label="Document view options"
          className="inline-flex rounded-xl p-1 bg-paper-200 border border-paper-border"
        >
          <button
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
          <button
            role="tab"
            aria-selected={viewMode === "image"}
            onClick={() => setViewMode("image")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "image"
                ? "bg-paper-50 text-ink shadow-sm font-semibold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Page Image
          </button>
        </div>

        {/* Page selector & Actions */}
        <div className="flex items-center gap-2">
          {pages.length > 1 && (
            <div className="flex items-center gap-1 text-xs font-medium text-ink-muted bg-paper-200 px-2.5 py-1 rounded-lg border border-paper-border">
              <span>Page:</span>
              <div className="flex gap-1">
                {pages.map((p) => (
                  <button
                    key={p.pageNumber}
                    onClick={() => onPageChange(p.pageNumber)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                      p.pageNumber === currentPageNumber
                        ? "bg-ink text-paper font-semibold"
                        : "hover:bg-paper-300 text-ink"
                    }`}
                    aria-label={`Go to page ${p.pageNumber}`}
                  >
                    {p.pageNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {viewMode === "text" && (
            <>
              {isEditing ? (
                <button
                  onClick={handleSaveAndReanalyze}
                  disabled={isReanalyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink text-paper text-xs font-medium hover:bg-ink-deep transition-colors shadow-sm disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isReanalyzing ? "animate-spin" : ""}`} />
                  Re-analyze
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-200 border border-paper-border text-ink text-xs font-medium hover:bg-paper-300 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Text
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Active Quote Banner */}
      {activeQuote && (
        <div className="px-4 py-2 bg-highlighter-solid/40 border-b border-paper-border text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-ink flex-shrink-0" />
            <span className="font-medium text-ink truncate">
              Highlighted cited quote: &quot;{activeQuote.slice(0, 70)}...&quot;
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-paper-50 border border-paper-border text-ink flex-shrink-0">
            Verified
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-paper-50">
        {viewMode === "text" ? (
          isEditing ? (
            <div className="flex flex-col h-full gap-3">
              <label htmlFor="editable-doc-text" className="text-xs text-ink-muted">
                You can edit or correct OCR extraction text below. Click &quot;Re-analyze&quot; to update key terms and verified quotes.
              </label>
              <textarea
                id="editable-doc-text"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full flex-1 min-h-[420px] p-4 text-sm font-mono leading-relaxed bg-paper-100 border border-paper-border rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent resize-none"
                placeholder="Paste or edit agreement text here..."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditedText(currentPage.text);
                    setIsEditing(false);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndReanalyze}
                  disabled={isReanalyzing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-paper text-xs font-medium hover:bg-ink-deep disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save & Re-analyze
                </button>
              </div>
            </div>
          ) : (
            <div className="font-mono text-xs sm:text-sm leading-relaxed text-ink selection:bg-highlighter-solid selection:text-ink">
              {renderHighlightedText(currentPage.text, activeQuote)}
            </div>
          )
        ) : (
          /* Page Image View */
          <div className="flex flex-col items-center justify-center min-h-[450px]">
            {currentPage.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentPage.imageUrl}
                alt={`Rental Agreement Page ${currentPage.pageNumber}`}
                className="max-w-full rounded-lg shadow-paper border border-paper-border object-contain"
              />
            ) : (
              /* Simulated High-Fidelity Agreement Document Canvas */
              <div className="w-full max-w-xl bg-[#FFFDF9] border border-paper-border-dark rounded-lg p-6 sm:p-8 shadow-paper-lg font-serif text-ink text-xs sm:text-sm relative overflow-hidden">
                {/* E-Stamp simulation header */}
                <div className="border-2 border-ink/80 rounded p-3 mb-6 bg-[#FAF5E8]/60 text-center">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-ink-muted">
                    Government of Karnataka · E-Stamp Certificate
                  </div>
                  <div className="font-serif font-bold text-sm sm:text-base tracking-wide text-ink mt-0.5">
                    CERTIFICATE OF STAMP DUTY
                  </div>
                  <div className="text-[10px] font-mono text-ink-muted mt-1">
                    Certificate No: IN-KA8829410192K · Stamp Duty: ₹100/- · Page {currentPage.pageNumber} of {pages.length}
                  </div>
                </div>

                {/* Agreement text rendered visually */}
                <div className="space-y-4 font-sans text-xs leading-relaxed text-ink/90">
                  {renderHighlightedText(currentPage.text, activeQuote)}
                </div>

                <div className="mt-8 pt-4 border-t border-paper-border flex justify-between text-[11px] font-mono text-ink-muted">
                  <span>Clausy Document Reader</span>
                  <span>Verified Page {currentPage.pageNumber}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
