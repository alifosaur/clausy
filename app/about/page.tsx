import Link from "next/link";
import { ArrowLeft, Award, Github } from "lucide-react";

export const metadata = {
  title: "About",
  description: "About Clausy: Problem Statement G3, Team judgesnightmareee, Track 1 Gemma 4 Hackathon.",
};

export default function AboutPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 text-center max-w-3xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-paper-100 border border-paper-border flex items-center justify-center mb-6 shadow-paper">
        <Award className="w-8 h-8 text-ink" />
      </div>

      <span className="text-xs font-mono uppercase tracking-widest text-ink-muted mb-3">
        Project & Team
      </span>

      <h1 className="font-serif text-3xl sm:text-5xl font-normal text-ink mb-4 tracking-tight">
        About Clausy
      </h1>

      <p className="text-sm sm:text-base text-ink-muted max-w-xl mx-auto leading-relaxed mb-6">
        Built for tenants navigating complex residential leases. Built for Hackathon Track 1 (Best Use of Gemma 4), addressing Problem Statement G3.
      </p>

      <div className="p-4 rounded-xl bg-paper-50 border border-paper-border text-xs text-ink-muted mb-8 max-w-md w-full text-left space-y-2">
        <p><strong>Team:</strong> <span className="font-mono">judgesnightmareee</span></p>
        <p><strong>Timeline:</strong> Built 13–18 October 2026</p>
        <p><strong>License:</strong> Open Source (MIT)</p>
        <p><strong>Policy:</strong> Educational reader. Not legal advice.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-paper-100 border border-paper-border text-ink text-sm font-medium hover:bg-paper-200 transition-colors focus-visible:ring-2 focus-visible:ring-ink"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <a
          href="https://github.com/judgesnightmareee/clausy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-colors focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Github className="w-4 h-4" />
          <span>GitHub Repository</span>
        </a>
      </div>
    </div>
  );
}
