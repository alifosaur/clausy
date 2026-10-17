"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastProvider, useToast } from "@/components/Toast";
import {
  UploadCloud,
  Sparkles,
  ShieldCheck,
  Calculator,
  AlertCircle,
  ArrowRight,
  SearchX,
} from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.includes("image/jpeg") && !file.type.includes("image/png")) {
        showToast("Please upload JPG or PNG images only.", "error");
        return;
      }
      showToast("Uploading agreement page...", "info");
      router.push("/workspace");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      router.push("/workspace");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-200 border border-paper-border text-xs text-ink-muted mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-highlighter-solid border border-ink" />
            <span className="font-mono uppercase tracking-wider text-[11px]">
              Gemma 4 · Track 1 Hackathon
            </span>
          </div>

          {/* Main Editorial Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-ink tracking-tight leading-[1.1] mb-6">
            Understand your rental agreement before you sign.
          </h1>

          <p className="text-base sm:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed mb-10">
            Upload photos of agreement pages. Gemma 4 reads them; code verifies every quote. Answers are cited or refused.
          </p>

          {/* ONE Obvious Next Action Box */}
          <div className="max-w-xl mx-auto bg-paper-50 border border-paper-border rounded-2xl p-6 sm:p-8 shadow-paper-lg space-y-4">
            <Link
              href="/workspace?sample=true"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-ink text-paper text-base font-medium hover:bg-ink-deep transition-all shadow-paper focus-visible:ring-2 focus-visible:ring-ink"
            >
              <Sparkles className="w-5 h-5 text-highlighter-solid" />
              <span>Try with Sample Agreement (Bengaluru)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-paper-border"></div>
              <span className="flex-shrink mx-4 text-xs uppercase font-mono text-ink-light">
                or upload your photos
              </span>
              <div className="flex-grow border-t border-paper-border"></div>
            </div>

            {/* Drag & drop upload area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-ink bg-highlighter-solid/20"
                  : "border-paper-border hover:border-paper-border-dark bg-paper-100/50"
              }`}
            >
              <label className="cursor-pointer block">
                <UploadCloud className="w-8 h-8 text-ink-muted mx-auto mb-2" />
                <span className="text-sm font-medium text-ink block">
                  Drop agreement photos here, or browse
                </span>
                <span className="text-xs text-ink-muted mt-1 block">
                  Supports multi-page JPG / PNG up to 5MB
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </label>
            </div>

            <p className="text-[11px] text-ink-light text-center pt-1">
              Documents are processed in-memory and sent to a hosted model. Nothing is saved or stored.
            </p>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 sm:py-20 border-t border-paper-border bg-paper-100/60 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-mono uppercase tracking-widest text-ink-muted block mb-2">
                Ground Truth Guarantee
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-ink">
                Built strictly to prevent AI hallucination.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 bg-paper-50 border border-paper-border rounded-2xl shadow-paper space-y-3">
                <div className="w-10 h-10 rounded-xl bg-highlighter-solid/40 border border-paper-border flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-ink" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink">
                  Code-Verified Quotes
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Every clause Gemma extracts is verified in deterministic code against the raw document. If a quote is not found, it is withheld or marked unverified.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-mono text-ink bg-paper-200 border border-paper-border px-2 py-0.5 rounded">
                    lib/verifier.ts
                  </span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 bg-paper-50 border border-paper-border rounded-2xl shadow-paper space-y-3">
                <div className="w-10 h-10 rounded-xl bg-highlighter-solid/40 border border-paper-border flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-ink" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink">
                  Deterministic Money Card
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Deposit multiples and notice coverage ratios are calculated directly in software math, not estimated by language models.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-mono text-ink bg-paper-200 border border-paper-border px-2 py-0.5 rounded">
                    lib/calculator.ts
                  </span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 bg-paper-50 border border-paper-border rounded-2xl shadow-paper space-y-3">
                <div className="w-10 h-10 rounded-xl bg-highlighter-solid/40 border border-paper-border flex items-center justify-center">
                  <SearchX className="w-5 h-5 text-ink" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink">
                  Honest Refusal
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  If your agreement doesn&apos;t mention pet rules, guest policies, or maintenance caps, Clausy refuses to guess and tells you: &ldquo;Not found in this agreement.&rdquo;
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-mono text-ink bg-paper-200 border border-paper-border px-2 py-0.5 rounded">
                    Strict refusal contract
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Walkthrough */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-ink-muted block mb-2">
              Step-by-Step Flow
            </span>
            <h2 className="font-serif text-3xl font-normal text-ink">
              From contract photos to clarity in 3 steps
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 p-5 rounded-2xl bg-paper-50 border border-paper-border items-start shadow-paper">
              <span className="w-8 h-8 rounded-full bg-ink text-paper text-sm font-semibold flex items-center justify-center flex-shrink-0">
                1
              </span>
              <div>
                <h3 className="font-serif text-base font-semibold text-ink">
                  Upload agreement photos or test the sample
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                  Snap clear photos of each agreement page with your phone camera or select our sample Bengaluru agreement.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-paper-50 border border-paper-border items-start shadow-paper">
              <span className="w-8 h-8 rounded-full bg-ink text-paper text-sm font-semibold flex items-center justify-center flex-shrink-0">
                2
              </span>
              <div>
                <h3 className="font-serif text-base font-semibold text-ink">
                  Gemma 4 extracts & code cross-verifies
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                  The model extracts rent, deposit, lock-in, and notice periods. Our verification algorithm confirms every cited sentence exists in the extracted text.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-paper-50 border border-paper-border items-start shadow-paper">
              <span className="w-8 h-8 rounded-full bg-ink text-paper text-sm font-semibold flex items-center justify-center flex-shrink-0">
                3
              </span>
              <div>
                <h3 className="font-serif text-base font-semibold text-ink">
                  Review flags, test presets, and ask your questions
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                  Click any quote to highlight it with the signature yellow marker stroke in the original text, and copy ready-to-send questions for your landlord.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/workspace?sample=true"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-all shadow-paper focus-visible:ring-2 focus-visible:ring-ink"
            >
              <span>Explore Workspace with Sample Agreement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Legal & Privacy Disclosure Notice */}
        <section className="py-12 border-t border-paper-border bg-paper-200/40 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-ink text-xs font-semibold uppercase tracking-wider font-mono">
              <AlertCircle className="w-4 h-4 text-ink" />
              <span>Copy Policy & Disclaimer</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Clausy suggests items &ldquo;worth asking your landlord&rdquo;. We never label clauses &ldquo;illegal&rdquo; or &ldquo;unfair&rdquo; and do not make normative market claims. Clausy is an educational document reader, not a law firm, and does not provide legal advice.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <HomeContent />
    </ToastProvider>
  );
}
