import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Award, Info, Scale, ArrowRight, Github, Lock } from "lucide-react";

export const metadata = {
  title: "About Clausy — Track 1 Gemma 4 Hackathon Project",
  description:
    "About Clausy: Problem Statement G3, Team judgesnightmareee, open source license, and privacy policies.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-ink-muted block mb-3">
            Hackathon Project & Team
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-ink tracking-tight mb-4">
            About Clausy
          </h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            Built for tenants navigating complex, opaque residential rental agreements. Built with Gemma 4, deterministic verification, and privacy-first principles.
          </p>
        </div>

        {/* Project & Hackathon Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-paper-50 border border-paper-border shadow-paper mb-10 space-y-6">
          <div className="flex items-center gap-2 text-ink">
            <Award className="w-5 h-5 text-ink" />
            <h2 className="font-serif text-xl font-semibold text-ink">
              Hackathon Submission Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-paper-100 border border-paper-border">
              <span className="text-[11px] font-mono uppercase text-ink-muted block">
                Track
              </span>
              <span className="font-semibold text-ink mt-0.5 block">
                Track 1 · Best Use of Gemma 4
              </span>
            </div>

            <div className="p-4 rounded-xl bg-paper-100 border border-paper-border">
              <span className="text-[11px] font-mono uppercase text-ink-muted block">
                Problem Statement
              </span>
              <span className="font-semibold text-ink mt-0.5 block">
                G3 · Agreement Clarity & Verification
              </span>
            </div>

            <div className="p-4 rounded-xl bg-paper-100 border border-paper-border">
              <span className="text-[11px] font-mono uppercase text-ink-muted block">
                Team
              </span>
              <span className="font-mono font-semibold text-ink mt-0.5 block">
                judgesnightmareee
              </span>
            </div>

            <div className="p-4 rounded-xl bg-paper-100 border border-paper-border">
              <span className="text-[11px] font-mono uppercase text-ink-muted block">
                Build Dates
              </span>
              <span className="font-semibold text-ink mt-0.5 block">
                13–18 October 2026
              </span>
            </div>
          </div>

          <div className="pt-2 text-xs text-ink-muted leading-relaxed">
            Public repository released under an open source license. Designed and tested with real-world Bengaluru residential agreements.
          </div>
        </div>

        {/* Privacy Policy: Sent to Hosted Model, Nothing Stored */}
        <div className="p-6 sm:p-8 rounded-2xl bg-paper-50 border border-paper-border shadow-paper mb-10 space-y-4">
          <div className="flex items-center gap-2 text-ink">
            <Lock className="w-5 h-5 text-ink" />
            <h2 className="font-serif text-xl font-semibold text-ink">
              Privacy Architecture (Zero-Storage Policy)
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Tenants handle sensitive personal data, including names, property addresses, and deposit figures. Clausy follows a strict stateless architecture:
          </p>

          <ul className="text-xs sm:text-sm text-ink-muted space-y-2 leading-relaxed">
            <li>
              • <strong>Hosted Model Processing:</strong> Document page images or text are sent to a hosted Gemma inference server for processing in-memory.
            </li>
            <li>
              • <strong>Zero Database:</strong> Clausy has no database, no file server, and no cloud object store. Your documents are never saved.
            </li>
            <li>
              • <strong>Zero Tracking:</strong> No cookies, no session stores, no marketing analytics, and no third-party tracking scripts.
            </li>
            <li>
              • <strong>Client-Side Session:</strong> Once you close the tab or click &ldquo;Start Over&rdquo;, your agreement data is wiped from your browser memory.
            </li>
          </ul>
        </div>

        {/* Terms of Use & Legal Disclaimer */}
        <div className="p-6 sm:p-8 rounded-2xl bg-paper-100 border border-paper-border shadow-paper mb-10 space-y-4">
          <div className="flex items-center gap-2 text-ink">
            <Scale className="w-5 h-5 text-ink" />
            <h2 className="font-serif text-xl font-semibold text-ink">
              Terms of Use & Not Legal Advice
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Clausy is an educational document reader, not a law firm or licensed legal practitioner. Clausy does not provide legal advice, legal representation, or formal contractual guarantees.
          </p>

          <div className="p-4 rounded-xl bg-paper-50 border border-paper-border text-xs text-ink space-y-2 leading-relaxed">
            <strong className="block text-ink">Our Copy & Editorial Standard:</strong>
            <p className="text-ink-muted">
              We describe potential ambiguities as &ldquo;worth asking your landlord&rdquo;. We deliberately never label clauses &ldquo;illegal&rdquo;, &ldquo;unfair&rdquo;, or &ldquo;overcharged&rdquo;, and make no claims regarding what is normal in Bengaluru or any other jurisdiction.
            </p>
          </div>
        </div>

        {/* Contact & Open Source */}
        <div className="p-6 sm:p-8 rounded-2xl bg-paper-50 border border-paper-border shadow-paper mb-16 space-y-4">
          <div className="flex items-center gap-2 text-ink">
            <Info className="w-5 h-5 text-ink" />
            <h2 className="font-serif text-xl font-semibold text-ink">
              Open Source & Contact
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Clausy is published as a public open-source project. For inquiries regarding evaluation benchmarks, reproduction steps, or model inference parameters:
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-paper-100 border border-paper-border text-xs font-medium text-ink hover:bg-paper-200 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>Public Repository</span>
            </a>
            <span className="inline-flex items-center px-4 py-2 rounded-xl bg-paper-200 text-xs font-mono text-ink-muted">
              team: judgesnightmareee
            </span>
          </div>
        </div>

        {/* ONE Obvious Next Action */}
        <div className="text-center bg-paper-50 border border-paper-border rounded-2xl p-8 shadow-paper">
          <h3 className="font-serif text-2xl font-normal text-ink mb-2">
            Ready to read an agreement?
          </h3>
          <p className="text-sm text-ink-muted mb-6">
            Jump directly into the workspace to examine key terms, the money card, and landlord questions.
          </p>
          <Link
            href="/workspace?sample=true"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-all shadow-paper focus-visible:ring-2 focus-visible:ring-ink"
          >
            <span>Launch Clausy Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
