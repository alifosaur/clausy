"use client";

import React from "react";
import { TermItem } from "@/types";
import { computeMoneyCard, MONEY_CARD_NOTE } from "@/lib/calc";
import {
  ShieldCheck,
  AlertCircle,
  Calculator,
  ArrowUpRight,
  Info,
} from "lucide-react";

interface KeyTermsTabProps {
  terms: TermItem[];
  onSelectQuote: (quote: string, page: number) => void;
  activeQuote?: string;
}

export function KeyTermsTab({ terms, onSelectQuote, activeQuote }: KeyTermsTabProps) {
  const metrics = computeMoneyCard(terms);

  return (
    <div className="space-y-6">
      {/* Deterministic Money Card: Calculated in CODE via lib/calc.ts */}
      <div className="bg-paper-100 border border-paper-border rounded-2xl p-5 shadow-paper">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-paper-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-highlighter-solid/60 border border-paper-border flex items-center justify-center">
              <Calculator className="w-4 h-4 text-ink" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-ink">
                Money Card
              </h3>
              <p className="text-[11px] font-mono text-ink-muted">
                Calculated in code (lib/calc.ts) · Deterministic math
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-paper-200 border border-paper-border px-2 py-0.5 rounded text-ink font-semibold">
            Code verified
          </span>
        </div>

        {metrics.isValid ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Deposit Multiple */}
              <div className="p-3 bg-paper-50 border border-paper-border rounded-xl">
                <span className="text-[10px] text-ink-muted block uppercase font-mono tracking-wider">
                  Deposit Multiple
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-serif text-2xl font-bold text-ink">
                    {metrics.depositMultipleOfRent}x
                  </span>
                  <span className="text-xs text-ink-muted">of rent</span>
                </div>
                <p className="text-[11px] text-ink-muted mt-1 truncate">
                  {metrics.formattedDeposit} deposit
                </p>
              </div>

              {/* Notice Coverage */}
              <div className="p-3 bg-paper-50 border border-paper-border rounded-xl">
                <span className="text-[10px] text-ink-muted block uppercase font-mono tracking-wider">
                  Notice Coverage
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-serif text-2xl font-bold text-ink">
                    {metrics.depositMultipleOfNotice}x
                  </span>
                  <span className="text-xs text-ink-muted">notice</span>
                </div>
                <p className="text-[11px] text-ink-muted mt-1 truncate">
                  Covers {metrics.noticePeriodMonths} mo. notice
                </p>
              </div>

              {/* Upfront Total */}
              <div className="p-3 bg-paper-50 border border-paper-border rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] text-ink-muted block uppercase font-mono tracking-wider">
                  Upfront Total
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-serif text-2xl font-bold text-ink">
                    {metrics.formattedUpfront}
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted mt-1 truncate">
                  Deposit + 1st month rent
                </p>
              </div>
            </div>

            {/* Note requirement */}
            <div className="px-3.5 py-2.5 rounded-xl bg-paper-200/70 border border-paper-border flex items-start gap-2 text-xs text-ink/90">
              <Info className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
              <span>
                <strong>Important note:</strong> {metrics.note || MONEY_CARD_NOTE}.
              </span>
            </div>
          </div>
        ) : (
          /* Error State when values cannot be parsed from text */
          <div className="p-4 bg-paper-50 border border-paper-border rounded-xl text-center">
            <AlertCircle className="w-5 h-5 text-ink-muted mx-auto mb-1.5" />
            <p className="text-sm font-semibold text-ink">
              {metrics.errorMessage || "Can't calculate from this text"}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              Could not extract valid monthly rent and security deposit amounts to calculate financial ratios.
            </p>
          </div>
        )}
      </div>

      {/* 6 Key Terms List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-normal text-ink">
            Key Lease Terms ({terms.length})
          </h3>
          <span className="text-xs text-ink-muted">
            Click quote to jump & highlight
          </span>
        </div>

        <div className="space-y-3">
          {terms.map((term) => {
            const isSelected = activeQuote === term.quote;
            return (
              <div
                key={term.key}
                onClick={() => onSelectQuote(term.quote, term.page)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-highlighter-solid/25 border-highlighter-accent shadow-sm"
                    : "bg-paper-50 border-paper-border hover:border-paper-border-dark hover:bg-paper-100"
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectQuote(term.quote, term.page);
                  }
                }}
                aria-label={`View clause for ${term.label}: ${term.value}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted block">
                      {term.label}
                    </span>
                    <span className="font-serif text-lg font-semibold text-ink">
                      {term.value}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] font-mono text-ink-muted bg-paper-200 border border-paper-border px-2 py-0.5 rounded">
                      Page {term.page}
                    </span>
                    {term.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink bg-highlighter-solid px-2 py-0.5 rounded border border-highlighter-accent font-mono">
                        <ShieldCheck className="w-3 h-3 text-ink" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted bg-paper-200 px-2 py-0.5 rounded border border-paper-border font-mono">
                        <AlertCircle className="w-3 h-3 text-ink-muted" />
                        Unverified
                      </span>
                    )}
                  </div>
                </div>

                {/* Verbatim Source Quote */}
                <div className="relative mt-2 p-2.5 rounded-lg bg-paper-100 border border-paper-border text-xs text-ink/90 font-mono leading-relaxed group">
                  <p className="line-clamp-3 italic">
                    &ldquo;{term.quote}&rdquo;
                  </p>
                  <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] font-sans font-medium text-ink-muted group-hover:text-ink">
                    <span>Show in document</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
