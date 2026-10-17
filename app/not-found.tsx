import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-paper-50 border border-paper-border rounded-2xl p-8 sm:p-10 shadow-paper">
        <div className="w-14 h-14 bg-highlighter-solid/30 border border-paper-border rounded-xl flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-7 h-7 text-ink" />
        </div>

        <span className="inline-block text-xs font-semibold tracking-wider uppercase text-ink-muted mb-2">
          Clause 404 · Not Found
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-ink mb-3 tracking-tight">
          This page isn’t in the agreement.
        </h1>

        <p className="text-sm text-ink-muted leading-relaxed mb-8">
          The route you requested could not be cited or located in Clausy. Let’s head back to the landing page or your workspace.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/workspace"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-paper-200 border border-paper-border text-ink text-sm font-medium hover:bg-paper-300 transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            Open Workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
