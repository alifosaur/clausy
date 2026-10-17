import React from "react";
import {
  Github,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
  Scale,
} from "lucide-react";
import {
  GITHUB_REPO_URL,
  GITHUB_ISSUES_URL,
  TEAM_NAME,
  HACKATHON_TRACK,
  PROBLEM_STATEMENT,
  GEMMA_MODEL_NAME,
  DATA_POLICY_NOTICE,
} from "@/lib/config";

export const metadata = {
  title: "About — Clausy",
  description:
    "About Clausy: Built by team judgesnightmareee for Track 1 Best Use of Gemma 4, addressing Problem Statement G3.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full overflow-x-hidden">
      {/* 1. Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono uppercase tracking-widest text-ink-muted mb-2 block">
          Project & Mission
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-ink tracking-tight mb-4">
          About Clausy
        </h1>
        <p className="text-base sm:text-lg text-ink-muted leading-relaxed font-sans max-w-2xl mx-auto">
          An evidence-first rental agreement reader designed to help tenants understand complex leases before signing, with every answer backed by verbatim quotes.
        </p>
      </div>

      {/* 2. The Problem & Hackathon Track */}
      <section className="mb-14" aria-labelledby="mission-heading">
        <div className="bg-paper-50 border border-paper-border rounded-2xl p-6 sm:p-8 shadow-paper space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-highlighter-solid/70 border border-highlighter-accent text-ink font-semibold">
              The Problem We Address
            </span>
          </div>

          <h2 id="mission-heading" className="font-serif text-2xl font-semibold text-ink">
            Tenants Sign What They Don&apos;t Fully Understand
          </h2>

          <p className="text-sm text-ink-muted leading-relaxed">
            Residential rental agreements often span multiple pages dense with technical clauses. Tenants frequently discover hidden lock-in forfeiture conditions, conflicting notice period clauses, or mandatory repainting deductions only when they prepare to vacate.
          </p>

          <p className="text-sm text-ink-muted leading-relaxed">
            Clausy uses <strong className="text-ink font-semibold">{GEMMA_MODEL_NAME}</strong> to read pages, extract critical terms, highlight ambiguous interactions worth asking the landlord about, and verify every single citation in software code.
          </p>

          <div className="mt-4 pt-4 border-t border-paper-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-ink-muted">
            <div className="p-3 bg-paper-100 rounded-xl border border-paper-border">
              <span className="text-ink-light block text-[10px] uppercase">Competition Track</span>
              <strong className="text-ink text-xs sm:text-sm">{HACKATHON_TRACK}</strong>
            </div>
            <div className="p-3 bg-paper-100 rounded-xl border border-paper-border">
              <span className="text-ink-light block text-[10px] uppercase">Problem Statement</span>
              <strong className="text-ink text-xs sm:text-sm">{PROBLEM_STATEMENT}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Team & Repository */}
      <section className="mb-14" aria-labelledby="team-heading">
        <div className="bg-paper-100 border border-paper-border rounded-2xl p-6 sm:p-8 shadow-paper">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                Open Source Project
              </span>
              <h2 id="team-heading" className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                Built by Team <span className="font-mono text-ink">{TEAM_NAME}</span>
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted">
                Released under the permissive MIT Open Source License.
              </p>
            </div>

            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-xs sm:text-sm font-medium hover:bg-ink-deep transition-colors shadow-paper focus-visible:ring-2 focus-visible:ring-ink flex-shrink-0"
            >
              <Github className="w-4 h-4" />
              <span>View on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-paper/70" />
            </a>
          </div>
        </div>
      </section>

      {/* 4. Limitations */}
      <section className="mb-14" aria-labelledby="limitations-heading">
        <div className="p-6 sm:p-8 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-ink flex-shrink-0" />
            <h2 id="limitations-heading" className="font-serif text-xl sm:text-2xl font-semibold text-ink">
              Known Limitations
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Honest engineering requires acknowledging what Clausy cannot do:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 bg-paper-100 rounded-xl border border-paper-border space-y-1.5">
              <strong className="text-xs sm:text-sm text-ink block">Not Legal Advice</strong>
              <p className="text-xs text-ink-muted leading-relaxed">
                Clausy is an educational document reading tool, not a legal advocate or law firm. It does not provide legal representation.
              </p>
            </div>

            <div className="p-4 bg-paper-100 rounded-xl border border-paper-border space-y-1.5">
              <strong className="text-xs sm:text-sm text-ink block">Poor Photo Quality</strong>
              <p className="text-xs text-ink-muted leading-relaxed">
                Low lighting, blurry camera captures, or distorted angles can lead to OCR reading misinterpretations.
              </p>
            </div>

            <div className="p-4 bg-paper-100 rounded-xl border border-paper-border space-y-1.5">
              <strong className="text-xs sm:text-sm text-ink block">Needs Clear Images</strong>
              <p className="text-xs text-ink-muted leading-relaxed">
                High-resolution, flat, well-lit captures produce the most dependable clause extractions and verified quotes.
              </p>
            </div>

            <div className="p-4 bg-paper-100 rounded-xl border border-paper-border space-y-1.5">
              <strong className="text-xs sm:text-sm text-ink block">Small Test Sample</strong>
              <p className="text-xs text-ink-muted leading-relaxed">
                The benchmark test suite has been evaluated against a focused set of tenancy agreements; expanded validation is ongoing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Privacy & Data Handling */}
      <section className="mb-14" aria-labelledby="privacy-heading">
        <div className="p-6 sm:p-8 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-ink flex-shrink-0" />
            <h2 id="privacy-heading" className="font-serif text-xl sm:text-2xl font-semibold text-ink">
              Privacy & Document Handling
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            We hold a simple, transparent privacy policy:
          </p>

          <ul className="space-y-2 text-xs sm:text-sm text-ink-muted list-disc list-inside">
            <li>Your uploaded files are loaded into browser memory and sent over secure HTTPS directly to the hosted model.</li>
            <li>No pages or extracted texts are stored on Clausy servers, saved to disk, or preserved in databases.</li>
            <li>{DATA_POLICY_NOTICE}</li>
            <li>Once you leave or close your browser tab, your uploaded document state is completely wiped from browser memory.</li>
          </ul>
        </div>
      </section>

      {/* 6. Terms & Not-Legal-Advice Disclaimer */}
      <section className="mb-14" aria-labelledby="terms-heading">
        <div className="p-6 sm:p-8 rounded-2xl bg-paper-100 border border-paper-border shadow-paper space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-ink flex-shrink-0" />
            <h2 id="terms-heading" className="font-serif text-xl sm:text-2xl font-semibold text-ink">
              Terms & Not-Legal-Advice
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Clausy provides information for personal educational review only. It is not an alternative to professional legal advice from an advocate or lawyer.
          </p>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Tenancy laws and local court interpretations vary by jurisdiction. You are responsible for reviewing your complete physical agreement and seeking independent counsel before signing any legally binding document.
          </p>
        </div>
      </section>

      {/* 7. Contact & Issue Tracker */}
      <section aria-labelledby="contact-heading">
        <div className="p-6 sm:p-8 rounded-2xl bg-paper-50 border border-paper-border shadow-paper flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-ink" />
              <h2 id="contact-heading" className="font-serif text-lg sm:text-xl font-semibold text-ink">
                Contact & Feedback
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-ink-muted">
              Found a bug, have an agreement edge case, or want to contribute?
            </p>
          </div>

          <a
            href={GITHUB_ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-paper-200 border border-paper-border text-ink text-xs sm:text-sm font-medium hover:bg-paper-300 transition-colors focus-visible:ring-2 focus-visible:ring-ink"
          >
            <span>Open an Issue on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
}
