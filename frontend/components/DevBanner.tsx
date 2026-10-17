"use client";

import React, { useEffect, useState } from "react";
import { API_URL, USE_MOCK, getLastExtractStats, ExtractStats } from "@/lib/api";

export function DevBanner() {
  const [stats, setStats] = useState<ExtractStats | null>(null);

  useEffect(() => {
    setStats(getLastExtractStats());
    const interval = setInterval(() => {
      setStats(getLastExtractStats());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Show ONLY when NODE_ENV is development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <aside
      aria-label="Development environment diagnostics"
      className="w-full bg-paper-200 border-b border-paper-border px-4 py-1.5 text-[11px] font-mono text-ink-muted flex flex-wrap items-center justify-between gap-3 shadow-xs"
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="font-semibold text-ink bg-highlighter-solid border border-highlighter-accent px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
          Dev Banner
        </span>
        <span>
          USE_MOCK: <strong className="text-ink">{String(USE_MOCK)}</strong>
        </span>
        <span className="text-ink-muted/50 hidden sm:inline">|</span>
        <span>
          API_URL: <strong className="text-ink">{API_URL}</strong>
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-ink">
        <span className="text-ink-muted">Last /extract:</span>
        {stats ? (
          <span className="font-semibold bg-paper-50 px-2 py-0.5 rounded border border-paper-border">
            Status {stats.status} ({stats.durationMs}ms)
          </span>
        ) : (
          <span className="text-ink-muted italic">none yet</span>
        )}
      </div>
    </aside>
  );
}
