"use client";

import React from "react";
import { TermItem } from "@/types";
import { computeFinancialMetrics } from "@/lib/calculator";
import { ShieldCheck, AlertCircle, Calculator, ArrowUpRight } from "lucide-react";

interface KeyTermsTabProps {
  terms: TermItem[];
  onSelectQuote: (quote: string, page: number) => void;
  activeQuote?: string;
}

export function KeyTermsTab({ terms, onSelectQuote, activeQuote }: KeyTermsTabProps) {
  const metrics = computeFinancialMetrics(terms);

  return (
    <div className="space-y-6">
      {/* Deterministic Money Card: Computed in CODE, not by the AI */}
      <div className="bg-paper-100 border border-paper-border rounded-2xl p-5 shadow-paper">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-paper-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-highlighter-solid/50 border border-paper-border flex items-center justify-center">
              <Calculator className="w-4 h-4 text-ink" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-ink">
                Money Card
              </h3>
              <p className="text-[11px] font-mono text-ink-muted">
                Calculated deterministically in code (lib/calculator.ts)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-paper-200 border border-paper-border px-2 py-0.5 rounded text-ink">
            Code verified
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-paper-50 border border-paper-border rounded-xl">
            <span className="text-[11px] text-ink-muted block uppercase font-mono">
              Deposit Multiple
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold text-ink">
                {metrics.depositMultipleOfRent}x
              </span>
              <span className="text-xs text-ink-muted">months rent</span>
            </div>
            <p className="text-[11px] text-ink-light mt-1">
              ₹{metrics.securityDeposit.toLocaleString("en-IN")} deposit
            </p>
          </div>

          <div className="p-3 bg-paper-50 border border-paper-border rounded-xl">
            <span className="text-[11px] text-ink-muted block uppercase font-mono">
              Notice Coverage
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold text-ink">
                {metrics.depositMultipleOfNotice}x
              </span>
              <span className="text-xs text-ink-muted">notice duration</span>
            </div>
            <p className="text-[11px] text-ink-light mt-1">
              Covers {metrics.noticePeriodMonths} mos. notice obligation
            </p>
          </div>

          <div className="p-3 bg-paper-50 border border-paper-border rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[11px] text-ink-muted block uppercase font-mono">
              Upfront at Signing
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold text-ink">
                ₹{metrics.upfrontTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[11px] text-ink-light mt-1">
              Deposit + 1st month rent
            </p>
          </div>
        </div>
      </div>

      {/* Key Terms List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-normal text-ink">
            Key Lease Terms
          </h3>
          <span className="text-xs text-ink-muted">
            Click quote to highlight on page
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
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink bg-highlighter-solid px-2 py-0.5 rounded border border-highlighter-accent">
                        <ShieldCheck className="w-3 h-3 text-ink" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted bg-paper-200 px-2 py-0.5 rounded border border-paper-border">
                        <AlertCircle className="w-3 h-3 text-ink-muted" />
                        Unverified
                      </span>
                    )}
                  </div>
                </div>

                {/* Source Quote */}
                <div className="relative mt-2 p-2.5 rounded-lg bg-paper-100 border border-paper-border text-xs text-ink/90 font-mono leading-relaxed group">
                  <p className="line-clamp-2 italic">
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
