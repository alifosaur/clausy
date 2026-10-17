"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/workspace", label: "Workspace" },
    { href: "/how-we-verify", label: "How We Verify" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-paper-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none rounded-lg p-1"
          aria-label="Clausy home"
        >
          <span className="font-serif text-2xl font-bold tracking-tight text-ink relative">
            Clausy
            <span className="absolute bottom-1 left-0 right-0 h-2 bg-highlighter-solid/70 -z-10 group-hover:bg-highlighter-accent transition-colors" />
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded border border-paper-border bg-paper-200 text-ink-muted hidden sm:inline-block">
            Gemma 4
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Primary navigation"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none ${
                  isActive
                    ? "bg-paper-200 text-ink font-semibold"
                    : "text-ink-muted hover:text-ink hover:bg-paper-200/60"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA / Action */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-all shadow-paper focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            Open Reader
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/workspace"
            className="px-3 py-1.5 rounded-lg bg-ink text-paper text-xs font-medium focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            Workspace
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-ink hover:bg-paper-200 transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-paper-border bg-paper-50 px-4 pt-2 pb-5 space-y-1 shadow-paper animate-fade-in">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-paper-200 text-ink font-semibold"
                    : "text-ink-muted hover:text-ink hover:bg-paper-200/50"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
