import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

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
          <span className="font-medium text-ink bg-highlighter-solid/60 px-2.5 py-0.5 rounded border border-paper-border">
            Not legal advice
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-ink-muted">
          {/* Brand & Team */}
          <div className="space-y-1">
            <div className="font-serif text-lg font-bold tracking-tight text-ink relative inline-block">
              Clausy
              <span className="absolute bottom-1 left-0 right-0 h-1.5 bg-highlighter-solid -z-10" />
            </div>
            <p className="text-ink-muted">
              Built by team <span className="font-mono font-medium text-ink">judgesnightmareee</span> for Track 1, Gemma 4.
            </p>
          </div>

          {/* Links: License, GitHub Placeholder, Contact */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-mono text-ink-light">
              MIT License
            </span>
            <span className="text-paper-border-dark">•</span>
            <a
              href="https://github.com/judgesnightmareee/clausy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:underline font-medium"
            >
              GitHub Repository
            </a>
            <span className="text-paper-border-dark">•</span>
            <a
              href="mailto:team@clausy.example"
              className="text-ink hover:underline font-medium"
            >
              Contact Team
            </a>
            <span className="text-paper-border-dark">•</span>
            <Link href="/about" className="text-ink hover:underline font-medium">
              About
            </Link>
          </div>
        </div>

        <div className="border-t border-paper-border mt-6 pt-4 text-center sm:text-left text-[11px] text-ink-light">
          © 2026 Clausy · Educational rental agreement reader. Not a law firm. Does not provide legal advice.
        </div>
      </div>
    </footer>
  );
}
