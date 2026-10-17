"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCw, ArrowLeft } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log non-sensitive error to console
    console.error("Clausy application error:", error.message);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto py-20">
      <div className="max-w-md w-full bg-paper-50 border border-paper-border rounded-2xl p-8 sm:p-10 shadow-paper">
        <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mx-auto mb-6 text-amber-700">
          <AlertCircle className="w-7 h-7" />
        </div>

        <span className="inline-block text-xs font-mono font-semibold tracking-wider uppercase text-ink-muted mb-2">
          Document Reader Interrupted
        </span>

        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink mb-3 tracking-tight">
          Something went wrong loading this page
        </h1>

        <p className="text-sm text-ink-muted leading-relaxed mb-8">
          An unexpected error occurred while rendering this section. No document data was lost. You can try refreshing or returning to the home page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-colors focus-visible:ring-2 focus-visible:ring-ink"
          >
            <RotateCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-paper-200 border border-paper-border text-ink text-sm font-medium hover:bg-paper-300 transition-colors focus-visible:ring-2 focus-visible:ring-ink"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
