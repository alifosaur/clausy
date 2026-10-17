"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Clausy root layout error:", error.message);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#FAF8F5] text-[#141413] min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#FAF8F5] border border-[#E8E5DF] rounded-2xl p-8 sm:p-10 shadow-lg text-center">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mx-auto mb-6 text-amber-700">
            <AlertCircle className="w-7 h-7" />
          </div>

          <span className="inline-block text-xs font-mono font-semibold tracking-wider uppercase text-[#73726C] mb-2">
            System Error
          </span>

          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#141413] mb-3 tracking-tight">
            Critical Reader Failure
          </h1>

          <p className="text-sm text-[#73726C] leading-relaxed mb-8">
            A critical system error occurred. You can reload the application using the button below.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#141413] text-[#FAF8F5] text-sm font-medium hover:bg-[#2B2A27] transition-colors focus:ring-2 focus:ring-[#141413]"
          >
            <RotateCw className="w-4 h-4" />
            <span>Reload Clausy</span>
          </button>
        </div>
      </body>
    </html>
  );
}
