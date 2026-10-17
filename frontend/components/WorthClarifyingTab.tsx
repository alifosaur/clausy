"use client";

import React, { useState } from "react";
import { FlagItem } from "@/types";
import { useToast } from "./Toast";
import { Copy, Check, MessageSquare, ArrowUpRight, HelpCircle } from "lucide-react";

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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyQuestion = (question: string, index: number) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(question);
      setCopiedIndex(index);
      showToast("Question copied to clipboard", "success");
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Context Banner */}
      <div className="p-4 rounded-xl bg-paper-100 border border-paper-border text-xs text-ink-muted flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-ink">Worth clarifying before signing:</strong> These flags highlight clauses with interacting conditions or unspecified terms worth asking your landlord about.
        </div>
      </div>

      {/* Flags List: 2-4 flags with side-by-side source clauses and question to landlord */}
      <div className="space-y-5">
        {flags.map((flag, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-4"
          >
            {/* Header */}
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-highlighter-solid/70 border border-paper-border text-ink font-semibold">
                Flag {idx + 1} · Worth Clarifying
              </span>
              <h4 className="font-serif text-base font-semibold text-ink mt-2 leading-snug">
                {flag.title}
              </h4>
            </div>

            {/* Explanation / Reason */}
            <p className="text-xs text-ink-muted leading-relaxed">
              {flag.reason}
            </p>

            {/* Side-by-Side Source Clauses */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted block mb-2">
                Interacting Source Clauses (Click to highlight in reader)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          ? "bg-highlighter-solid/35 border-highlighter-accent shadow-sm ring-1 ring-highlighter-accent"
                          : "bg-paper-100 border-paper-border hover:border-paper-border-dark hover:bg-paper-200/70"
                      }`}
                    >
                      <p className="italic text-ink/90 line-clamp-4">
                        &ldquo;{quote}&rdquo;
                      </p>
                      <div className="mt-2 pt-2 border-t border-paper-border/70 flex items-center justify-between text-[10px] font-sans text-ink-muted group-hover:text-ink">
                        <span className="font-mono">Clause {qIdx + 1}</span>
                        <span className="inline-flex items-center gap-0.5 font-medium">
                          Show in doc
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Copy-Ready Question to Landlord */}
            <div className="p-3.5 rounded-xl bg-paper-200/80 border border-paper-border">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink font-semibold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Question to ask your landlord
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyQuestion(flag.question, idx)}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-paper-50 border border-paper-border text-ink hover:bg-paper-100 transition-colors focus-visible:ring-2 focus-visible:ring-ink"
                  aria-label={`Copy question for ${flag.title}`}
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-ink" />
                      <span className="font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-ink font-medium leading-relaxed italic bg-paper-50/70 p-2.5 rounded-lg border border-paper-border/60">
                &ldquo;{flag.question}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mandatory Footer Note */}
      <div className="pt-4 pb-2 border-t border-paper-border text-center">
        <p className="text-xs font-mono text-ink-muted">
          Questions to ask your landlord. Not legal advice.
        </p>
      </div>
    </div>
  );
}
