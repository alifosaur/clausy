import Link from "next/link";
import { ArrowLeft, ShieldCheck, ArrowRight } from "lucide-react";

export const metadata = {
  title: "How We Verify",
  description: "How Clausy eliminates LLM hallucinations through deterministic code-level quote verification.",
};

export default function HowWeVerifyPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 text-center max-w-3xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-paper-100 border border-paper-border flex items-center justify-center mb-6 shadow-paper">
        <ShieldCheck className="w-8 h-8 text-ink" />
      </div>

      <span className="text-xs font-mono uppercase tracking-widest text-ink-muted mb-3">
        Verification Scaffold
      </span>

      <h1 className="font-serif text-3xl sm:text-5xl font-normal text-ink mb-4 tracking-tight">
        How We Verify Every Quote
      </h1>

      <p className="text-sm sm:text-base text-ink-muted max-w-xl mx-auto leading-relaxed mb-8">
        Clausy pairs Gemma 4 semantic clause extraction with deterministic code-level verification. Every quote must exist in the raw document text, and missing topics trigger a strict refusal contract.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-paper-100 border border-paper-border text-ink text-sm font-medium hover:bg-paper-200 transition-colors focus-visible:ring-2 focus-visible:ring-ink"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link
          href="/about"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-colors focus-visible:ring-2 focus-visible:ring-ink"
        >
          <span>About Team & Project</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
