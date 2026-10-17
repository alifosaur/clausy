import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  Code2,
  ArrowRight,
  Camera,
  Lock,
} from "lucide-react";
import { GEMMA_MODEL_NAME } from "@/lib/config";
import { EVAL_TEST_RESULTS, EVALUATION_NOTE } from "@/lib/evalResults";

export const metadata = {
  title: "How We Verify — Clausy",
  description:
    "How Clausy pairs Gemma 4 clause extraction with deterministic code-level quote verification to eliminate hallucinations.",
};

export default function HowWeVerifyPage() {
  return (
    <div className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full overflow-x-hidden">
      {/* 1. Header & Intro */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono uppercase tracking-widest text-ink-muted mb-2 block">
          Verification Architecture
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-ink tracking-tight mb-4">
          How Clausy Verifies Every Clause
        </h1>
        <p className="text-base sm:text-lg text-ink-muted leading-relaxed font-sans max-w-2xl mx-auto">
          Rental agreements are binding commitments. Clausy never asks you to trust an AI summary on faith. Every answer is anchored by an exact quote, and verified by deterministic code before it reaches your screen.
        </p>
      </div>

      {/* 2. Pipeline Flow Diagram (HTML/CSS only, no images) */}
      <section className="mb-20" aria-labelledby="pipeline-diagram-heading">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
            End-to-End Pipeline
          </span>
          <h2 id="pipeline-diagram-heading" className="font-serif text-2xl font-semibold text-ink mt-1">
            From Agreement Photo to Verified Answer
          </h2>
        </div>

        <div className="bg-paper-100 border border-paper-border rounded-2xl p-6 sm:p-8 shadow-paper">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
            {/* Step 1: Document Photos */}
            <div className="bg-paper-50 border border-paper-border rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-paper-200 border border-paper-border text-ink font-semibold">
                    Step 1
                  </span>
                  <Camera className="w-4 h-4 text-ink-muted" />
                </div>
                <h3 className="font-serif text-base font-semibold text-ink mb-1.5">
                  Page Photos Uploaded
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Tenant provides clear photos or scans of the signed or drafted rental agreement.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-paper-border text-[11px] font-mono text-ink-light">
                JPG / PNG · Max 5 pages
              </div>
            </div>

            {/* Step 2: Gemma 4 Reads */}
            <div className="bg-paper-50 border border-paper-border rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-highlighter-solid/70 border border-highlighter-accent text-ink font-semibold">
                    Step 2
                  </span>
                  <Cpu className="w-4 h-4 text-ink" />
                </div>
                <h3 className="font-serif text-base font-semibold text-ink mb-1.5">
                  {GEMMA_MODEL_NAME} Reads
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  The model performs multimodal OCR, extracts lease terms, and identifies source clauses.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-paper-border text-[11px] font-mono text-ink-light">
                Multimodal AI comprehension
              </div>
            </div>

            {/* Step 3: Quote Check in Code */}
            <div className="bg-paper-50 border border-highlighter-accent/60 rounded-xl p-5 flex flex-col justify-between ring-1 ring-highlighter-accent/40 bg-highlighter-solid/10">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-ink text-paper font-semibold">
                    Step 3
                  </span>
                  <Code2 className="w-4 h-4 text-ink" />
                </div>
                <h3 className="font-serif text-base font-semibold text-ink mb-1.5">
                  Quote Check in Code
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Software cross-checks every cited phrase against the raw extracted text. No hallucinated text passes.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-paper-border text-[11px] font-mono text-ink font-semibold">
                Deterministic string matching
              </div>
            </div>

            {/* Step 4: Answer Shown or Withheld */}
            <div className="bg-paper-50 border border-paper-border rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-paper-200 border border-paper-border text-ink font-semibold">
                    Step 4
                  </span>
                  <ShieldCheck className="w-4 h-4 text-ink" />
                </div>
                <h3 className="font-serif text-base font-semibold text-ink mb-1.5">
                  Answer or Strict Refusal
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Verified answers highlight exact source text. Unmentioned questions trigger an explicit refusal.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-paper-border text-[11px] font-mono text-ink-light">
                Answered or withheld
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "What the AI does / what code does" (Two Columns) */}
      <section className="mb-20" aria-labelledby="division-of-labor-heading">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
            Division of Responsibility
          </span>
          <h2 id="division-of-labor-heading" className="font-serif text-2xl font-semibold text-ink mt-1">
            What the AI Does vs. What Code Does
          </h2>
          <p className="text-sm text-ink-muted max-w-xl mx-auto mt-2">
            Clausy draws a strict boundary: AI reads and proposes, but software code verifies and calculates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column A: What the AI Does */}
          <div className="p-6 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-paper-border">
              <div className="w-8 h-8 rounded-lg bg-highlighter-solid/60 border border-paper-border flex items-center justify-center">
                <Cpu className="w-4 h-4 text-ink" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-ink">
                  What the AI Does ({GEMMA_MODEL_NAME})
                </h3>
                <p className="text-[11px] font-mono text-ink-muted">
                  Semantic document understanding
                </p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-ink/90 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-xs font-mono text-ink-muted font-bold mt-1">01</span>
                <div>
                  <strong className="text-ink">Reads agreement pages:</strong> Performs vision OCR on camera captures and scans across irregular legal printings.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-xs font-mono text-ink-muted font-bold mt-1">02</span>
                <div>
                  <strong className="text-ink">Extracts candidate terms:</strong> Identifies rent, security deposit, notice periods, and lock-in durations from paragraph text.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-xs font-mono text-ink-muted font-bold mt-1">03</span>
                <div>
                  <strong className="text-ink">Finds clauses worth clarifying:</strong> Discovers interacting clauses (such as lock-in forfeiture vs. notice periods) that create tenant ambiguity.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-xs font-mono text-ink-muted font-bold mt-1">04</span>
                <div>
                  <strong className="text-ink">Drafts concise answers:</strong> Cites verbatim sentences rather than rewriting or generating ungrounded advice.
                </div>
              </li>
            </ul>
          </div>

          {/* Column B: What Code Does */}
          <div className="p-6 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-paper-border">
              <div className="w-8 h-8 rounded-lg bg-ink text-paper flex items-center justify-center">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-ink">
                  What Code Does (Software Engine)
                </h3>
                <p className="text-[11px] font-mono text-ink-muted">
                  Deterministic guarantees & safety
                </p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-ink/90 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-xs font-mono text-ink-muted font-bold mt-1">01</span>
                <div>
                  <strong className="text-ink">Verifies quote existence:</strong> String-matches every citation against extracted page text. If a quote cannot be verified, it is marked unverified.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-xs font-mono text-ink-muted font-bold mt-1">02</span>
                <div>
                  <strong className="text-ink">Computes deposit and notice math:</strong> Multiples (e.g. 5.0x deposit, 2.5x notice coverage) are calculated with software arithmetic, never LLM token generation.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-xs font-mono text-ink-muted font-bold mt-1">03</span>
                <div>
                  <strong className="text-ink">Enforces omission refusal:</strong> If an agreement omits a topic, code ensures the UI clearly displays &quot;Not found in this agreement&quot; instead of guessing.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-xs font-mono text-ink-muted font-bold mt-1">04</span>
                <div>
                  <strong className="text-ink">Enforces file and rate limits:</strong> Restricts file sizes to 10 MB, page counts to 5, and controls request throughput via FastAPI backend guards.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. "Our test results" (Table from lib/evalResults.ts) */}
      <section className="mb-20" aria-labelledby="eval-results-heading">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
            Evaluation Benchmark Set
          </span>
          <h2 id="eval-results-heading" className="font-serif text-2xl font-semibold text-ink mt-1">
            Our Test Results
          </h2>
          <p className="text-sm text-ink-muted max-w-xl mx-auto mt-2">
            Every test case in our suite verifies that cited clauses are grounded and unmentioned topics are refused.
          </p>
        </div>

        <div className="bg-paper-50 border border-paper-border rounded-2xl shadow-paper overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-paper-100 border-b border-paper-border text-[11px] font-mono uppercase text-ink-muted">
                <tr>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Question</th>
                  <th scope="col" className="py-3.5 px-4">Expected Behavior</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-border font-sans">
                {EVAL_TEST_RESULTS.map((row) => (
                  <tr key={row.id} className="hover:bg-paper-100/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-ink">
                      {row.question}
                    </td>
                    <td className="py-3.5 px-4 text-ink-muted">
                      {row.expected}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded bg-paper-200 border border-paper-border text-ink-muted">
                        {row.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mandatory Evaluation Note */}
          <div className="p-4 bg-paper-100 border-t border-paper-border text-xs text-ink-muted">
            <p className="font-mono leading-relaxed">
              <strong>Note:</strong> {EVALUATION_NOTE}
            </p>
          </div>
        </div>
      </section>

      {/* 5. "Where your document goes" (Honest Disclosure) */}
      <section className="mb-16" aria-labelledby="data-privacy-heading">
        <div className="p-6 sm:p-8 rounded-2xl bg-paper-100 border border-paper-border shadow-paper">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-paper-50 border border-paper-border flex items-center justify-center flex-shrink-0 mt-1">
              <Lock className="w-5 h-5 text-ink" />
            </div>
            <div className="space-y-3">
              <h2 id="data-privacy-heading" className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                Where Your Document Goes
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                We believe in full transparency regarding document processing. When you upload pages, they are sent to a hosted instance of the <strong className="text-ink font-semibold">{GEMMA_MODEL_NAME}</strong> model strictly for reading and clause extraction.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-ink-muted list-disc list-inside">
                <li>
                  <strong className="text-ink">In-Memory Processing:</strong> Uploaded images are kept in volatile memory during the active session. Nothing is written to a persistent database or permanent disk storage.
                </li>
                <li>
                  <strong className="text-ink">Zero Training on User Documents:</strong> Your rental agreements are never retained, logged for model re-training, or shared with third parties.
                </li>
                <li>
                  <strong className="text-ink">Open Weights for Future Local Deployment:</strong> Because Gemma open weights are freely available, private on-device or self-hosted deployment without third-party network transmission is fully architecturally viable.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <div className="text-center pt-4">
        <Link
          href="/workspace?sample=1"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-colors shadow-paper focus-visible:ring-2 focus-visible:ring-ink"
        >
          <span>Try the Sample Agreement</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
