"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDocumentFiles } from "@/components/DocumentContext";
import { useToast } from "@/components/Toast";
import { extract, categorizeError, CategorizedError, health } from "@/lib/api";
import { verifyTerms, verifyQuoteInPages } from "@/lib/verifier";
import { DocumentPage, TermItem, FlagItem, AppLanguage } from "@/lib/types";
import { SearchMatch } from "@/lib/search";
import { DocumentViewer } from "@/components/DocumentViewer";
import { DocumentSearch } from "@/components/DocumentSearch";
import { KeyTermsTab } from "@/components/KeyTermsTab";
import { WorthClarifyingTab } from "@/components/WorthClarifyingTab";
import { AskTab } from "@/components/AskTab";
import {
  FileText,
  AlertCircle,
  RotateCw,
  ArrowLeft,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  BookOpen,
  FileQuestion,
  Layers,
  Languages,
} from "lucide-react";

type AnalysisTab = "terms" | "flags" | "ask";
type MobileView = "document" | "analysis";

export default function WorkspaceClient() {
  const searchParams = useSearchParams();
  const isSample = searchParams.get("sample") === "1" || searchParams.get("sample") === "true";
  const { files } = useDocumentFiles();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorInfo, setErrorInfo] = useState<CategorizedError | null>(null);

  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [flags, setFlags] = useState<FlagItem[]>([]);

  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [activeQuote, setActiveQuote] = useState<string | undefined>(undefined);
  const [activeSearchMatch, setActiveSearchMatch] = useState<SearchMatch | null>(null);
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [activeTab, setActiveTab] = useState<AnalysisTab>("terms");
  const [mobileView, setMobileView] = useState<MobileView>("document");
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Language state: React state ONLY (no localStorage)
  const [currentLang, setCurrentLang] = useState<AppLanguage>("en");
  const [sarvamEnabled, setSarvamEnabled] = useState(false);

  const tabListRef = useRef<HTMLDivElement>(null);

  // Query health endpoint on mount to detect if Sarvam language services are enabled
  useEffect(() => {
    health()
      .then((res) => {
        if (res.sarvam_enabled !== undefined) {
          setSarvamEnabled(Boolean(res.sarvam_enabled));
        }
      })
      .catch(() => {});
  }, []);

  // Check if neither sample nor uploaded files exist
  const hasSource = isSample || (files && files.length > 0);

  const runExtraction = async () => {
    if (!hasSource) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setElapsedSeconds(0);
    setErrorInfo(null);

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const response = await extract(files && files.length > 0 ? files : undefined, { isSample });
      const extractedPages = response.pages || [];
      const extractedTerms = response.terms || [];
      const extractedFlags = response.flags || [];

      // Attach blob URLs for real uploaded pages when not sample
      const mappedPages: DocumentPage[] = extractedPages.map((p, idx) => {
        const file = !isSample && files && files[idx] ? files[idx] : undefined;
        const imageUrl = file ? URL.createObjectURL(file) : p.imageUrl;
        return {
          ...p,
          imageUrl,
          fileName: file?.name || p.fileName,
        };
      });

      // Verify terms quotes deterministically against extracted pages
      const verifiedTerms = verifyTerms(extractedTerms, mappedPages);

      setPages(mappedPages);
      setTerms(verifiedTerms);
      setFlags(extractedFlags);
      setCurrentPageNumber(1);
      setActiveQuote(undefined);
      setErrorInfo(null);
    } catch (err: unknown) {
      const cat = categorizeError(err);
      setErrorInfo(cat);
    } finally {
      clearInterval(timerInterval);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runExtraction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSample, files]);

  // Handle quote selection from any tab in right panel
  const handleSelectQuote = (quote: string, targetPage?: number) => {
    setActiveQuote(quote);
    setActiveSearchMatch(null); // Clear search highlight so quote highlight is shown

    // Locate the page containing the quote
    const verification = verifyQuoteInPages(quote, pages);
    if (verification.isVerified && verification.pageNumber) {
      setCurrentPageNumber(verification.pageNumber);
    } else if (targetPage) {
      setCurrentPageNumber(targetPage);
    }

    // On mobile, auto-switch to Document view so user sees the highlighted quote
    setMobileView("document");
  };

  // Handle search match navigation
  const handleSelectSearchMatch = (match: SearchMatch | null) => {
    setActiveSearchMatch(match);
    if (match) {
      setCurrentPageNumber(match.pageNumber);
      setActiveQuote(undefined); // Clear quote highlight so search highlight is shown
    }
  };

  // Handle user updating extracted text in textarea
  const handleUpdatePageText = (pageNumber: number, newText: string) => {
    setPages((prevPages) =>
      prevPages.map((p) => (p.pageNumber === pageNumber ? { ...p, text: newText } : p))
    );
  };

  // Re-analyze verification and recalculate Key Terms and Money Card
  const handleReanalyze = () => {
    setIsReanalyzing(true);
    // Re-verify terms against updated pages
    const updatedTerms = verifyTerms(terms, pages);
    setTerms(updatedTerms);

    showToast("Document re-analyzed. Verifications updated.", "success");
    setIsReanalyzing(false);
  };

  // Keyboard navigation for analysis tabs (Arrow keys, Home, End)
  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const tabs: AnalysisTab[] = ["terms", "flags", "ask"];
    const currentIndex = tabs.indexOf(activeTab);

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextTab = tabs[(currentIndex + 1) % tabs.length];
      setActiveTab(nextTab);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
      setActiveTab(prevTab);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveTab("terms");
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveTab("ask");
    }
  };

  // 1. EMPTY STATE: Neither sample nor files exist
  if (!hasSource) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-paper-100 border border-paper-border flex items-center justify-center mb-6 shadow-paper">
          <FileQuestion className="w-8 h-8 text-ink" />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-ink-muted mb-2">
          No Agreement Loaded
        </span>
        <h1 className="font-serif text-2xl sm:text-4xl font-normal text-ink mb-3 tracking-tight">
          Upload an agreement or try the sample
        </h1>
        <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed mb-8 font-sans">
          Clausy needs a document to read. Upload your rental agreement pages on the home page, or explore our anonymised Bengaluru sample agreement.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-colors focus-visible:ring-2 focus-visible:ring-ink"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Upload My Agreement</span>
          </Link>
          <Link
            href="/workspace?sample=1"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-paper-100 border border-paper-border text-ink text-sm font-medium hover:bg-paper-200 transition-colors focus-visible:ring-2 focus-visible:ring-ink"
          >
            <BookOpen className="w-4 h-4" />
            <span>Try Sample Agreement</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. LOADING STATE: Honest progress text with elapsed-seconds counter
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-highlighter-solid/40 border border-highlighter-accent flex items-center justify-center mb-6 animate-pulse">
          <RotateCw className="w-7 h-7 text-ink animate-spin" />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-ink-muted mb-2">
          Clausy Document Analysis
        </span>
        <h2 className="font-serif text-2xl font-normal text-ink mb-2">
          Reading your pages. This can take up to a minute.
        </h2>
        <span className="text-xs font-mono text-ink-muted mb-4 block">
          {elapsedSeconds}s elapsed
        </span>
        <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
          Transcribing page clauses, verifying quotes, and analyzing financial commitments...
        </p>
        <div className="w-48 h-1 bg-paper-200 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-ink rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  // 3. ERROR STATE with Retry button and reason category
  if (errorInfo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center mb-4 text-amber-700">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-200 border border-paper-border text-ink text-[11px] font-mono uppercase tracking-wider mb-3">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Reason: {errorInfo.categoryLabel || errorInfo.category}</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-ink mb-2">
          Could not read agreement
        </h2>
        <p className="text-xs sm:text-sm text-ink-muted mb-6 leading-relaxed max-w-md">
          {errorInfo.message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={runExtraction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-colors focus-visible:ring-2 focus-visible:ring-ink"
          >
            <RotateCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-paper-100 border border-paper-border text-ink text-sm font-medium hover:bg-paper-200 transition-colors"
          >
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  // 4. MAIN WORKSPACE: Split desktop view, 2-tab mobile view
  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
      {/* Workspace Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-paper-border">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="p-1.5 rounded-lg border border-paper-border hover:bg-paper-200 text-ink transition-colors"
            title="Back to landing page"
            aria-label="Back to home page"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-lg sm:text-xl font-semibold text-ink tracking-tight">
                Rental Agreement Workspace
              </h1>
              {isSample ? (
                <span className="text-[11px] font-mono uppercase bg-highlighter-solid/80 text-ink px-2.5 py-0.5 rounded-md font-semibold border border-highlighter-accent">
                  Demo data (sample agreement)
                </span>
              ) : (
                <span className="text-[11px] font-mono uppercase bg-paper-200 text-ink px-2.5 py-0.5 rounded-md font-semibold border border-paper-border">
                  Read from your upload · {pages.length} {pages.length === 1 ? "page" : "pages"}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted">
              {isSample
                ? "Bengaluru Rental Agreement · 3 Pages · Demo Sample"
                : `Uploaded Rental Agreement · ${pages.length} Pages · Verbatim clause verification`}
            </p>
          </div>
        </div>

        {/* Right Header Controls: Sarvam Language Selector & Mobile View Switcher */}
        <div className="flex items-center gap-2">
          {/* Sarvam Language Selector: English / ಕನ್ನಡ / हिन्दी (React state only, hidden if SARVAM_ENABLED is false) */}
          {sarvamEnabled && (
            <div
              role="group"
              aria-label="Select display language"
              className="inline-flex rounded-xl p-1 bg-paper-200 border border-paper-border text-xs"
            >
              <div className="hidden sm:flex items-center pl-2 pr-1 text-ink-muted">
                <Languages className="w-3.5 h-3.5" />
              </div>
              <button
                type="button"
                onClick={() => setCurrentLang("en")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  currentLang === "en"
                    ? "bg-paper-50 text-ink shadow-sm font-semibold"
                    : "text-ink-muted hover:text-ink"
                }`}
                aria-pressed={currentLang === "en"}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang("kn")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  currentLang === "kn"
                    ? "bg-paper-50 text-ink shadow-sm font-semibold"
                    : "text-ink-muted hover:text-ink"
                }`}
                aria-pressed={currentLang === "kn"}
              >
                ಕನ್ನಡ
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang("hi")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  currentLang === "hi"
                    ? "bg-paper-50 text-ink shadow-sm font-semibold"
                    : "text-ink-muted hover:text-ink"
                }`}
                aria-pressed={currentLang === "hi"}
              >
                हिन्दी
              </button>
            </div>
          )}

          {/* Mobile View Switcher (Visible only below lg: 1024px) */}
          <div
            role="tablist"
            aria-label="Mobile workspace view"
            className="lg:hidden inline-flex rounded-xl p-1 bg-paper-200 border border-paper-border"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === "document"}
              onClick={() => setMobileView("document")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mobileView === "document"
                  ? "bg-paper-50 text-ink shadow-sm font-semibold"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === "analysis"}
              onClick={() => setMobileView("analysis")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mobileView === "analysis"
                  ? "bg-paper-50 text-ink shadow-sm font-semibold"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[620px]">
        {/* Left Column: Document Viewer (Desktop: 6/7 cols, Mobile: toggleable) */}
        <div
          className={`lg:col-span-6 xl:col-span-7 flex flex-col h-full min-h-[500px] ${
            mobileView === "document" ? "block" : "hidden lg:block"
          }`}
        >
          {/* Find in Document Search Box */}
          <DocumentSearch
            pages={pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text }))}
            currentPageNumber={currentPageNumber}
            onSelectMatch={handleSelectSearchMatch}
            onMatchesFound={(matches) => setSearchMatches(matches)}
          />

          <DocumentViewer
            pages={pages}
            currentPageNumber={currentPageNumber}
            onPageChange={(pageNum) => setCurrentPageNumber(pageNum)}
            onUpdatePageText={handleUpdatePageText}
            onReanalyze={handleReanalyze}
            activeQuote={activeQuote}
            activeSearchMatch={activeSearchMatch}
            searchMatches={searchMatches}
            isReanalyzing={isReanalyzing}
            isSample={isSample}
          />
        </div>

        {/* Right Column: Analysis Panel (Desktop: 5/6 cols, Mobile: toggleable) */}
        <div
          className={`lg:col-span-6 xl:col-span-5 flex flex-col h-full bg-paper-50 border border-paper-border rounded-2xl shadow-paper overflow-hidden ${
            mobileView === "analysis" ? "block" : "hidden lg:block"
          }`}
        >
          {/* Analysis Tab Navigation with full Arrow Key support */}
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="Analysis sections"
            onKeyDown={handleTabKeyDown}
            className="flex items-center border-b border-paper-border bg-paper-100 p-2 gap-1 overflow-x-auto"
          >
            <button
              id="tab-terms"
              role="tab"
              type="button"
              tabIndex={activeTab === "terms" ? 0 : -1}
              aria-selected={activeTab === "terms"}
              aria-controls="panel-terms"
              onClick={() => setActiveTab("terms")}
              className={`flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-ink ${
                activeTab === "terms"
                  ? "bg-paper-50 text-ink shadow-sm font-semibold border border-paper-border"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Key Terms</span>
            </button>

            <button
              id="tab-flags"
              role="tab"
              type="button"
              tabIndex={activeTab === "flags" ? 0 : -1}
              aria-selected={activeTab === "flags"}
              aria-controls="panel-flags"
              onClick={() => setActiveTab("flags")}
              className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-ink ${
                activeTab === "flags"
                  ? "bg-paper-50 text-ink shadow-sm font-semibold border border-paper-border"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Worth Clarifying ({flags.length})</span>
            </button>

            <button
              id="tab-ask"
              role="tab"
              type="button"
              tabIndex={activeTab === "ask" ? 0 : -1}
              aria-selected={activeTab === "ask"}
              aria-controls="panel-ask"
              onClick={() => setActiveTab("ask")}
              className={`flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-ink ${
                activeTab === "ask"
                  ? "bg-paper-50 text-ink shadow-sm font-semibold border border-paper-border"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Agreement</span>
            </button>
          </div>

          {/* Analysis Tab Panels */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {activeTab === "terms" && (
              <div
                id="panel-terms"
                role="tabpanel"
                aria-labelledby="tab-terms"
                className="animate-fade-in"
              >
                <KeyTermsTab
                  terms={terms}
                  onSelectQuote={handleSelectQuote}
                  activeQuote={activeQuote}
                />
              </div>
            )}

            {activeTab === "flags" && (
              <div
                id="panel-flags"
                role="tabpanel"
                aria-labelledby="tab-flags"
                className="animate-fade-in"
              >
                <WorthClarifyingTab
                  flags={flags}
                  onSelectQuote={handleSelectQuote}
                  activeQuote={activeQuote}
                  lang={currentLang}
                  sarvamEnabled={sarvamEnabled}
                />
              </div>
            )}

            {activeTab === "ask" && (
              <div
                id="panel-ask"
                role="tabpanel"
                aria-labelledby="tab-ask"
                className="animate-fade-in"
              >
                <AskTab
                  pages={pages}
                  onSelectQuote={handleSelectQuote}
                  activeQuote={activeQuote}
                  isSample={isSample}
                  lang={currentLang}
                  sarvamEnabled={sarvamEnabled}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
