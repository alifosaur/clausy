"use client";

import React, { useState } from "react";
import { DocumentPage, AnswerItem } from "@/lib/types";
import { ask, PRESET_QUESTIONS } from "@/lib/api";
import {
  Send,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface AskTabProps {
  pages: DocumentPage[];
  onSelectQuote: (quote: string, page?: number) => void;
  activeQuote?: string;
}

const MAX_QUESTION_CHARS = 500;

export function AskTab({ pages, onSelectQuote, activeQuote }: AskTabProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerItem | null>(null);
  const [askedQuestion, setAskedQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (queryToAsk?: string) => {
    const q = (queryToAsk !== undefined ? queryToAsk : question).trim();
    if (!q || isLoading || q.length > MAX_QUESTION_CHARS) return;

    setIsLoading(true);
    setError(null);
    setAskedQuestion(q);

    try {
      const fullText = pages.map((p) => p.text).join("\n\n");
      const response = await ask(q, fullText);
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

  const charsRemaining = MAX_QUESTION_CHARS - question.length;
  const isOverLimit = charsRemaining < 0;

  return (
    <div className="space-y-6">
      {/* "Try to break it" Preset chips row */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-ink" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
            Try to break it:
          </span>
          <span className="text-[11px] text-ink-muted">
            (Preset queries testing citation vs refusal)
          </span>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Preset questions">
          {PRESET_QUESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(item.question)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-xl border border-paper-border bg-paper-100 hover:bg-paper-200 text-ink font-medium transition-all text-left flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-50"
            >
              <span>{item.label}</span>
              <span
                className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                  item.expectedStatus === "not_found"
                    ? "bg-paper-300 text-ink-muted"
                    : "bg-highlighter-solid/80 text-ink font-semibold"
                }`}
              >
                {item.expectedStatus === "not_found" ? "Refusal" : "Cited"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Free-text Question Form (Max 500 chars) */}
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
            placeholder="Ask about deposit return, notice, pets, painting, repairs..."
            maxLength={MAX_QUESTION_CHARS + 20}
            className={`w-full px-4 py-3 pr-24 rounded-xl border bg-paper-50 text-ink placeholder:text-ink-muted/60 text-sm focus:outline-none focus:ring-2 focus:border-transparent shadow-sm ${
              isOverLimit
                ? "border-amber-600 focus:ring-amber-600"
                : "border-paper-border focus:ring-ink"
            }`}
          />
          <button
            type="submit"
            disabled={!question.trim() || isOverLimit || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-ink text-paper text-xs font-medium hover:bg-ink-deep disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:ring-2 focus-visible:ring-ink"
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

        {/* Live Character Counter */}
        <div className="flex items-center justify-between px-1 text-[11px] font-mono">
          <span className="text-ink-muted">
            Ask any question. Answers cite exact clauses or refuse if unmentioned.
          </span>
          <span
            className={
              isOverLimit
                ? "text-amber-700 font-semibold"
                : "text-ink-muted"
            }
          >
            {question.length}/{MAX_QUESTION_CHARS}
          </span>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="p-3.5 rounded-xl bg-paper-200 border border-paper-border text-xs text-ink flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-ink flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Answer Output */}
      {currentAnswer && (
        <div className="p-5 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-border pb-3">
            <span className="text-[11px] font-mono text-ink-muted">
              Question: &ldquo;{askedQuestion}&rdquo;
            </span>

            {/* Status Pill: "Answered with clause" vs "Not found in this agreement" */}
            {currentAnswer.status === "answered" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink bg-highlighter-solid px-2.5 py-0.5 rounded-full border border-highlighter-accent font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-ink" />
                Answered with clause
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted bg-paper-200 px-2.5 py-0.5 rounded-full border border-paper-border font-mono">
                <AlertCircle className="w-3.5 h-3.5 text-ink-muted" />
                Not found in this agreement
              </span>
            )}
          </div>

          {/* Answer Text */}
          <p className="text-sm text-ink leading-relaxed font-sans">
            {currentAnswer.text}
          </p>

          {/* Cited clauses (click to highlight on page) */}
          {currentAnswer.status === "answered" && currentAnswer.quotes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-paper-border">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted block">
                Cited Source Clause{currentAnswer.quotes.length > 1 ? "s" : ""} (Click to highlight in reader):
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
                        ? "bg-highlighter-solid/35 border-highlighter-accent shadow-sm ring-1 ring-highlighter-accent"
                        : "bg-paper-100 border-paper-border hover:bg-paper-200/70"
                    }`}
                  >
                    <p className="italic text-ink/90 line-clamp-3">&ldquo;{quote}&rdquo;</p>
                    <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-ink-muted group-hover:text-ink flex-shrink-0">
                      <span>Show in doc</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Friendly note for "not_found" status */}
          {currentAnswer.status === "not_found" && (
            <div className="p-3.5 bg-paper-100 rounded-xl border border-paper-border text-xs text-ink-muted leading-relaxed flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Document does not settle this question:</strong>{" "}
                This topic is not addressed anywhere in the extracted agreement text. If this matter is important for your tenancy, it is worth asking your landlord to confirm terms in writing before signing.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
