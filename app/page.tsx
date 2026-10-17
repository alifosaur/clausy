import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-200 border border-paper-border text-xs text-ink-muted mb-6 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-highlighter-solid border border-ink" />
        <span className="font-mono uppercase tracking-wider text-[11px]">
          Clausy · Gemma 4
        </span>
      </div>

      <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-ink tracking-tight leading-[1.1] mb-6">
        Understand your rental agreement before you sign.
      </h1>

      <p className="text-base sm:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed mb-10">
        Upload photos of agreement pages. Gemma reads them; code verifies every quote. Answers are cited or refused.
      </p>

      <div className="max-w-md w-full bg-paper-50 border border-paper-border rounded-2xl p-6 sm:p-8 shadow-paper-lg space-y-4">
        <Link
          href="/workspace"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-ink text-paper text-base font-medium hover:bg-ink-deep transition-all shadow-paper focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Sparkles className="w-5 h-5 text-highlighter-solid" />
          <span>Open Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-xs text-ink-light pt-1">
          Every screen has one obvious next action.
        </p>
      </div>
    </div>
  );
}
