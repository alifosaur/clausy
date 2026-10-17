"use client";

import React, { useState } from "react";
import { DocumentPage, AnswerItem } from "@/types";
import { askAgreementQuestion } from "@/lib/api";
import { PRESET_BREAK_IT_QUESTIONS } from "@/lib/sampleData";
import { Send, ShieldCheck, AlertCircle, ArrowUpRight, Sparkles } from "lucide-react";

interface AskTabProps {
  pages: DocumentPage[];
  onSelectQuote: (quote: string, page?: number) => void;
  activeQuote?: string;
}

export function AskTab({ pages, onSelectQuote, activeQuote }: AskTabProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerItem | null>(null);
  const [askedQuestion, setAskedQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (queryToAsk?: string) => {
    const q = (queryToAsk || question).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAskedQuestion(q);

    try {
      const response = await askAgreementQuestion(q, pages);
      setCurrentAnswer(response);
      if (response.quotes && response.quotes.length > 0) {
        onSelectQuote(response.quotes[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to answer question";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (presetQ: string) => {
    setQuestion(presetQ);
    handleAsk(presetQ);
  };

  return (
    <div className="space-y-6">
      {/* Try to Break It row of preset chips */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-ink" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
            Try to break it:
          </span>
          <span className="text-[11px] text-ink-muted">
            (Preset tests for citations vs refusals)
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_BREAK_IT_QUESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(item.question)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-xl border border-paper-border bg-paper-100 hover:bg-paper-200 text-ink font-medium transition-all text-left flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-ink"
            >
              <span>{item.label}</span>
              <span
                className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono ${
                  item.expectedStatus === "not_found"
                    ? "bg-paper-300 text-ink-muted"
                    : "bg-highlighter-solid/80 text-ink"
                }`}
              >
                {item.expectedStatus === "not_found" ? "Refusal" : "Cited"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Question Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="space-y-2"
      >
        <div className="relative">
          <label htmlFor="agreement-question-input" className="sr-only">
            Ask a question about this agreement
          </label>
          <input
            id="agreement-question-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about painting, notice period, visitors, repairs..."
            className="w-full px-4 py-3 pr-24 rounded-xl border border-paper-border bg-paper-50 text-ink placeholder:text-ink-light text-sm focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent shadow-sm"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-ink text-paper text-xs font-medium hover:bg-ink-deep disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {isLoading ? (
              <span className="animate-spin text-xs">●</span>
            ) : (
              <>
                <span>Ask</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-3.5 rounded-xl bg-paper-200 border border-paper-border text-xs text-ink flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-ink flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Answer Output */}
      {currentAnswer && (
        <div className="p-5 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-paper-border pb-2.5">
            <span className="text-[11px] font-mono text-ink-muted">
              Question: &ldquo;{askedQuestion}&rdquo;
            </span>

            {currentAnswer.status === "answered" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink bg-highlighter-solid px-2 py-0.5 rounded border border-highlighter-accent">
                <ShieldCheck className="w-3 h-3 text-ink" />
                Cited & Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted bg-paper-200 px-2 py-0.5 rounded border border-paper-border">
                <AlertCircle className="w-3 h-3 text-ink-muted" />
                Refused · Not in agreement
              </span>
            )}
          </div>

          {/* Answer Text */}
          <p className="text-sm text-ink leading-relaxed font-sans">
            {currentAnswer.text}
          </p>

          {/* Cited quotes if answered */}
          {currentAnswer.status === "answered" && currentAnswer.quotes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-paper-border">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted block">
                Cited Source Clauses (Click to highlight):
              </span>
              {currentAnswer.quotes.map((quote, qIdx) => {
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
                    className={`p-3 rounded-xl border text-xs font-mono leading-relaxed transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-highlighter-solid/30 border-highlighter-accent shadow-sm"
                        : "bg-paper-100 border-paper-border hover:bg-paper-200/60"
                    }`}
                  >
                    <p className="italic text-ink/90">&ldquo;{quote}&rdquo;</p>
                    <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-ink-muted group-hover:text-ink flex-shrink-0">
                      <span>View</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Refusal guidance */}
          {currentAnswer.status === "not_found" && (
            <div className="p-3 bg-paper-100 rounded-xl border border-paper-border text-xs text-ink-muted leading-relaxed">
              <strong className="text-ink">Verification note:</strong> This topic is completely unaddressed in your lease text. If this matter is important to your tenancy, it is worth asking your landlord to put agreed terms in writing.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
