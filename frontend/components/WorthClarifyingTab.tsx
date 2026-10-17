"use client";

import React from "react";
import { FlagItem } from "@/types";
import { useToast } from "./Toast";
import { Copy, Check, MessageSquare, AlertCircle, ArrowUpRight } from "lucide-react";

interface WorthClarifyingTabProps {
  flags: FlagItem[];
  onSelectQuote: (quote: string, page?: number) => void;
  activeQuote?: string;
}

export function WorthClarifyingTab({
  flags,
  onSelectQuote,
  activeQuote,
}: WorthClarifyingTabProps) {
  const { showToast } = useToast();
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopyQuestion = (question: string, index: number) => {
    navigator.clipboard.writeText(question);
    setCopiedIndex(index);
    showToast("Question copied to clipboard", "success");
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Notice Card */}
      <div className="p-4 rounded-xl bg-paper-100 border border-paper-border text-xs text-ink-muted flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-ink">Note: Not legal advice.</strong> These flags highlight interacting clauses that are worth asking your landlord to clarify before signing.
        </div>
      </div>

      {/* Flags List */}
      <div className="space-y-5">
        {flags.map((flag, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-highlighter-solid/60 border border-paper-border text-ink font-semibold">
                  Flag {idx + 1} · Worth Asking
                </span>
                <h4 className="font-serif text-base font-semibold text-ink mt-1.5 leading-snug">
                  {flag.title}
                </h4>
              </div>
            </div>

            {/* Reason */}
            <p className="text-xs text-ink-muted leading-relaxed">
              {flag.reason}
            </p>

            {/* Side-by-Side Source Clauses */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted block mb-2">
                Interacting Source Clauses (Click to highlight in document)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {flag.quotes.map((quote, qIdx) => {
                  const isSelected = activeQuote === quote;
                  return (
                    <div
                      key={qIdx}
                      onClick={() => onSelectQuote(quote)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectQuote(quote);
                        }
                      }}
                      className={`p-3 rounded-xl border text-xs font-mono leading-relaxed transition-all cursor-pointer group flex flex-col justify-between ${
                        isSelected
                          ? "bg-highlighter-solid/30 border-highlighter-accent shadow-sm"
                          : "bg-paper-100 border-paper-border hover:border-paper-border-dark hover:bg-paper-200/60"
                      }`}
                    >
                      <p className="italic text-ink/90 line-clamp-4">
                        &ldquo;{quote}&rdquo;
                      </p>
                      <div className="mt-2 pt-2 border-t border-paper-border/70 flex items-center justify-between text-[10px] font-sans text-ink-muted group-hover:text-ink">
                        <span>Clause {qIdx + 1}</span>
                        <span className="inline-flex items-center gap-0.5">
                          View in doc
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question to Ask Landlord */}
            <div className="p-3.5 rounded-xl bg-paper-200/70 border border-paper-border">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink font-medium flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Question to ask your landlord
                </span>
                <button
                  onClick={() => handleCopyQuestion(flag.question, idx)}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-paper-50 border border-paper-border text-ink hover:bg-paper-100 transition-colors focus-visible:ring-2 focus-visible:ring-ink"
                  aria-label="Copy question"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-ink" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-ink font-medium leading-relaxed italic">
                &ldquo;{flag.question}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
