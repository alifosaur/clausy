import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Code2,
  Cpu,
  Calculator,
  ArrowRight,
  FileCheck,
} from "lucide-react";

export const metadata = {
  title: "How We Verify — Anti-Hallucination Pipeline",
  description:
    "How Clausy eliminates LLM hallucinations through deterministic code-level quote verification and mathematical computation.",
};

export default function HowWeVerifyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-ink-muted block mb-3">
            Anti-Hallucination Architecture
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-ink tracking-tight mb-4">
            How Clausy verifies every word in code.
          </h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            Tenants cannot afford AI hallucinations when evaluating legal obligations. Here is how our dual-engine architecture guarantees ground truth.
          </p>
        </div>

        {/* Comparison: Standard AI vs Clausy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Flawed LLM pattern */}
          <div className="p-6 rounded-2xl bg-paper-50 border border-paper-border space-y-3">
            <div className="flex items-center gap-2 text-ink-muted">
              <XCircle className="w-5 h-5 text-ink-muted" />
              <span className="text-xs font-mono uppercase font-semibold">
                Typical LLM Contract Tools
              </span>
            </div>
            <h3 className="font-serif text-lg font-medium text-ink">
              Trusts the language model blindly
            </h3>
            <ul className="text-xs sm:text-sm text-ink-muted space-y-2 leading-relaxed">
              <li>• LLMs frequently invent plausible-sounding clause numbers.</li>
              <li>• Arithmetic (such as deposit-to-rent multiples) is frequently hallucinated.</li>
              <li>• When a term is missing, models often guess based on training data stereotypes.</li>
            </ul>
          </div>

          {/* Clausy's Deterministic Pattern */}
          <div className="p-6 rounded-2xl bg-paper-50 border-2 border-highlighter-accent shadow-paper space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-highlighter-solid px-3 py-1 rounded-bl-xl text-[10px] font-mono font-bold text-ink">
              CLAUSY PIPELINE
            </div>
            <div className="flex items-center gap-2 text-ink">
              <CheckCircle2 className="w-5 h-5 text-ink" />
              <span className="text-xs font-mono uppercase font-semibold">
                Gemma 4 + Deterministic Code
              </span>
            </div>
            <h3 className="font-serif text-lg font-medium text-ink">
              Code verifies every single citation
            </h3>
            <ul className="text-xs sm:text-sm text-ink space-y-2 leading-relaxed">
              <li>• Gemma 4 extracts candidate quotes into a typed JSON contract.</li>
              <li>• <code className="bg-paper-200 px-1 py-0.5 rounded text-xs font-mono">lib/verifier.ts</code> checks exact substrings in the extracted document text.</li>
              <li>• Quotes not found in the source text are strictly withheld or marked unverified.</li>
            </ul>
          </div>
        </div>

        {/* Step-by-Step Architecture Pipeline */}
        <div className="space-y-8 mb-16">
          <h2 className="font-serif text-2xl font-normal text-ink text-center">
            The 4-Stage Verification Pipeline
          </h2>

          <div className="space-y-4">
            {/* Stage 1 */}
            <div className="p-6 rounded-2xl bg-paper-50 border border-paper-border shadow-paper flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-paper-200 border border-paper-border flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-5 h-5 text-ink" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                  Stage 1 · Document Ingestion
                </span>
                <h3 className="font-serif text-lg font-semibold text-ink mt-0.5">
                  Multi-page image processing & text extraction
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                  Agreement page photos are normalized in memory. Text is extracted with precise per-page segmentation, maintaining exact line breaks and paragraph boundaries.
                </p>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-6 rounded-2xl bg-paper-50 border border-paper-border shadow-paper flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-highlighter-solid/40 border border-paper-border flex items-center justify-center flex-shrink-0">
                <Cpu className="w-5 h-5 text-ink" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                  Stage 2 · Gemma 4 Model Inference
                </span>
                <h3 className="font-serif text-lg font-semibold text-ink mt-0.5">
                  Semantic clause identification & data extraction
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                  Gemma 4 identifies rent, deposit, lock-in clauses, notice requirements, penalties, and interacting provisions. The model is constrained to output candidate verbatim citations.
                </p>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-6 rounded-2xl bg-paper-50 border-2 border-highlighter-accent shadow-paper flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-highlighter-solid border border-paper-border flex items-center justify-center flex-shrink-0">
                <Code2 className="w-5 h-5 text-ink" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink font-semibold">
                  Stage 3 · Deterministic Code Verification
                </span>
                <h3 className="font-serif text-lg font-semibold text-ink mt-0.5">
                  Raw text cross-verification in lib/verifier.ts
                </h3>
                <p className="text-xs sm:text-sm text-ink leading-relaxed mt-1">
                  Before any quote appears in the user interface, TypeScript code checks whether the exact quote exists in the extracted document text. If a quote cannot be verified, it is withheld.
                </p>
              </div>
            </div>

            {/* Stage 4 */}
            <div className="p-6 rounded-2xl bg-paper-50 border border-paper-border shadow-paper flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-paper-200 border border-paper-border flex items-center justify-center flex-shrink-0">
                <Calculator className="w-5 h-5 text-ink" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                  Stage 4 · Deterministic Financial Math
                </span>
                <h3 className="font-serif text-lg font-semibold text-ink mt-0.5">
                  Deposit multiples computed in software math
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                  Deposit-to-rent ratios, notice coverage, and total upfront costs at signing are computed purely through deterministic arithmetic in <code className="text-xs font-mono bg-paper-200 px-1 py-0.5 rounded">lib/calculator.ts</code>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Refusal Contract Note */}
        <div className="p-6 rounded-2xl bg-paper-100 border border-paper-border mb-16 text-xs sm:text-sm text-ink-muted leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-medium text-ink">
            <ShieldCheck className="w-4 h-4 text-ink" />
            <span>The Clausy Refusal Contract</span>
          </div>
          <p>
            When a tenant asks about a topic not mentioned in the agreement (e.g., &ldquo;Can I keep a pet?&rdquo; or &ldquo;Can I sublet on Airbnb?&rdquo;), Clausy refuses to guess. It returns:
          </p>
          <div className="p-3 bg-paper-50 border border-paper-border rounded-xl font-mono text-xs text-ink">
            &ldquo;Not found in this agreement. No clauses address this topic in the extracted document.&rdquo;
          </div>
          <p>
            This ensures tenants know exactly what is omitted from the contract and need to clarify with their landlord.
          </p>
        </div>

        {/* Single Obvious Next Action */}
        <div className="text-center bg-paper-50 border border-paper-border rounded-2xl p-8 shadow-paper">
          <h3 className="font-serif text-2xl font-normal text-ink mb-2">
            See the verification engine in action
          </h3>
          <p className="text-sm text-ink-muted mb-6">
            Test the sample Bengaluru rental agreement with verified quotes and preset test questions.
          </p>
          <Link
            href="/workspace?sample=true"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-all shadow-paper focus-visible:ring-2 focus-visible:ring-ink"
          >
            <span>Open Workspace with Verified Sample</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
