import React from "react";
import { RotateCw } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto py-24"
      role="status"
      aria-live="polite"
    >
      <div className="w-12 h-12 rounded-2xl bg-highlighter-solid/40 border border-highlighter-accent flex items-center justify-center mb-4 animate-pulse">
        <RotateCw className="w-6 h-6 text-ink animate-spin" />
      </div>
      <p className="font-serif text-lg text-ink font-normal">Loading Clausy...</p>
      <span className="text-xs font-mono text-ink-muted mt-1">Reading agreement workspace</span>
    </div>
  );
}
