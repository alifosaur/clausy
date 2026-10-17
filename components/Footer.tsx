import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-paper-border bg-paper-100 text-ink-muted text-sm mt-auto">
      {/* Notice Banner */}
      <div className="border-b border-paper-border bg-paper-200/50 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-ink flex-shrink-0" />
            <span>
              <strong>Privacy first:</strong> Documents are processed in-memory and sent to a hosted model. Nothing is saved or stored.
            </span>
          </div>
          <span className="font-medium text-ink bg-highlighter-solid/60 px-2 py-0.5 rounded border border-paper-border">
            Not legal advice
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <span className="font-serif text-xl font-bold tracking-tight text-ink relative inline-block">
              Clausy
              <span className="absolute bottom-1 left-0 right-0 h-1.5 bg-highlighter-solid -z-10" />
            </span>
            <p className="text-sm text-ink-muted leading-relaxed max-w-md">
              Helping tenants understand rental agreements without hallucinations. Gemma reads agreement pages; code verifies every quote; answers are cited or refused.
            </p>
            <p className="text-xs text-ink-light pt-2">
              Track 1: Best Use of Gemma 4 · Problem Statement G3 · Open Source License
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h3 className="font-medium text-ink text-xs uppercase tracking-wider mb-3">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-ink transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/workspace" className="hover:text-ink transition-colors">
                  Workspace
                </Link>
              </li>
              <li>
                <Link href="/how-we-verify" className="hover:text-ink transition-colors">
                  How We Verify
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-ink transition-colors">
                  About & Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Disclaimer & Contact */}
          <div>
            <h3 className="font-medium text-ink text-xs uppercase tracking-wider mb-3">
              Disclaimer & Info
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed mb-3">
              Clausy is an educational document reader, not a law firm. Clausy does not provide legal advice or attorney representation.
            </p>
            <p className="text-xs text-ink-muted">
              Built 13–18 Oct 2026 by{" "}
              <span className="font-mono font-medium text-ink">judgesnightmareee</span>.
            </p>
          </div>
        </div>

        <div className="border-t border-paper-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-light">
          <p>© 2026 Clausy · Built for Bengaluru & Indian tenants with Gemma 4</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-ink fill-ink" /> for tenant clarity
          </p>
        </div>
      </div>
    </footer>
  );
}
