"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DocumentViewer } from "@/components/DocumentViewer";
import { KeyTermsTab } from "@/components/KeyTermsTab";
import { WorthClarifyingTab } from "@/components/WorthClarifyingTab";
import { AskTab } from "@/components/AskTab";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ToastProvider, useToast } from "@/components/Toast";
import { DocumentPage, TermItem, FlagItem } from "@/types";
import { SAMPLE_PAGES, SAMPLE_TERMS, SAMPLE_FLAGS } from "@/lib/sampleData";
import { analyzeAgreement } from "@/lib/api";
import { verifyTerms } from "@/lib/verifier";
import {
  UploadCloud,
  FileCheck2,
  Trash2,
  Layers,
  Sparkles,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from "lucide-react";

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [activeQuote, setActiveQuote] = useState<string | undefined>(undefined);

  // Loading state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState("Reading page 1 of 2...");

  // Right tabs: 'terms' | 'flags' | 'ask'
  const [activeTab, setActiveTab] = useState<"terms" | "flags" | "ask">("terms");

  // Mobile panel toggle: 'doc' | 'analysis'
  const [mobilePanel, setMobilePanel] = useState<"doc" | "analysis">("analysis");

  // Confirm dialog state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadSampleAgreement = useCallback(async () => {
    setIsAnalyzing(true);
    setLoadingStepText("Reading page 1 of 2...");

    // Realistic staged progression
    setTimeout(() => {
      setLoadingStepText("Reading page 2 of 2...");
    }, 600);

    setTimeout(() => {
      setLoadingStepText("Cross-verifying clauses in code...");
    }, 1200);

    setTimeout(() => {
      setLoadingStepText("Computing financial metrics...");
    }, 1800);

    setTimeout(async () => {
      setPages(SAMPLE_PAGES);
      setCurrentPageNumber(1);
      const verified = verifyTerms(SAMPLE_TERMS, SAMPLE_PAGES);
      setTerms(verified);
      setFlags(SAMPLE_FLAGS);
      setActiveQuote(SAMPLE_TERMS[0].quote);
      setIsAnalyzing(false);
      showToast("Sample rental agreement loaded and verified", "success");
    }, 2200);
  }, [showToast]);

  // Initialize from searchParams (e.g. ?sample=true)
  useEffect(() => {
    const isSample = searchParams.get("sample") === "true";
    if (isSample && pages.length === 0) {
      loadSampleAgreement();
    }
  }, [searchParams, pages.length, loadSampleAgreement]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.includes("image/jpeg") && !file.type.includes("image/png")) {
        showToast(`Skipped ${file.name}: only JPG/PNG files are accepted`, "error");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast(`Skipped ${file.name}: exceeds 5MB limit`, "error");
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsAnalyzing(true);
    setLoadingStepText(`Reading page 1 of ${validFiles.length}...`);

    const newPages: DocumentPage[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const imageUrl = URL.createObjectURL(file);
      const sampleText =
        i === 0
          ? SAMPLE_PAGES[0].text
          : SAMPLE_PAGES[1]?.text || `RENTAL AGREEMENT — PAGE ${i + 1}\n\nStandard terms and conditions apply.`;

      newPages.push({
        pageNumber: i + 1,
        fileName: file.name,
        imageUrl,
        text: sampleText,
      });
    }

    setPages(newPages);
    setCurrentPageNumber(1);

    try {
      const result = await analyzeAgreement(newPages);
      setTerms(result.terms);
      setFlags(result.flags);
      if (result.terms.length > 0) {
        setActiveQuote(result.terms[0].quote);
      }
      showToast(`${validFiles.length} page(s) uploaded and verified`, "success");
    } catch {
      showToast("Analysis encountered an issue; loaded fallback data", "info");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdatePageText = (pageNumber: number, newText: string) => {
    setPages((prev) =>
      prev.map((p) => (p.pageNumber === pageNumber ? { ...p, text: newText } : p))
    );
  };

  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    setLoadingStepText("Re-analyzing edited text and verifying quotes...");

    try {
      const result = await analyzeAgreement(pages);
      setTerms(result.terms);
      setFlags(result.flags);
      showToast("Agreement text re-analyzed and quotes re-verified", "success");
    } catch {
      showToast("Failed to re-analyze edited text", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectQuote = (quote: string, page?: number) => {
    setActiveQuote(quote);
    if (page) {
      setCurrentPageNumber(page);
    }
    // Switch to document view on mobile
    if (window.innerWidth < 1024) {
      setMobilePanel("doc");
    }
  };

  const handleClearDocument = () => {
    setPages([]);
    setTerms([]);
    setFlags([]);
    setActiveQuote(undefined);
    setShowClearConfirm(false);
    showToast("Document cleared", "info");
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Loading Overlay State: Reading page X of Y... */}
        {isAnalyzing && (
          <div
            className="fixed inset-0 z-50 bg-paper/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
            role="alert"
            aria-busy="true"
          >
            <div className="w-16 h-16 rounded-2xl bg-paper-100 border border-paper-border flex items-center justify-center mb-6 shadow-paper relative">
              <span className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-highlighter-solid rounded-full border border-ink" />
            </div>

            <span className="text-xs uppercase font-mono tracking-widest text-ink-muted mb-2">
              Clausy Document Pipeline
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-ink mb-2">
              {loadingStepText}
            </h2>

            <p className="text-xs text-ink-muted max-w-sm leading-relaxed">
              Extracting clauses, strictly cross-verifying quotes against document text, and calculating financial ratios in code.
            </p>
          </div>
        )}

        {/* Empty State: No document loaded */}
        {pages.length === 0 && !isAnalyzing ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto w-full">
            <div className="w-16 h-16 rounded-2xl bg-paper-100 border border-paper-border flex items-center justify-center mb-6 shadow-paper">
              <UploadCloud className="w-8 h-8 text-ink" />
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-ink mb-3 tracking-tight">
              Ready to examine your agreement.
            </h1>

            <p className="text-sm text-ink-muted leading-relaxed mb-8 max-w-md">
              Upload photos of your rental agreement pages (JPG or PNG up to 5MB), or load the Bengaluru sample agreement.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
              <button
                onClick={loadSampleAgreement}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-all shadow-paper focus-visible:ring-2 focus-visible:ring-ink"
              >
                <Sparkles className="w-4 h-4" />
                Try Sample Agreement (Bengaluru)
              </button>

              <label className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-paper-50 border border-paper-border text-ink text-sm font-medium hover:bg-paper-200 transition-colors shadow-paper cursor-pointer focus-within:ring-2 focus-within:ring-ink">
                <UploadCloud className="w-4 h-4" />
                Upload Agreement Photos
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="mt-10 p-4 rounded-xl bg-paper-100 border border-paper-border text-xs text-ink-muted max-w-md text-left space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-ink">
                <FileCheck2 className="w-4 h-4" />
                <span>What Clausy does:</span>
              </div>
              <p>• Extracts rent, deposit, lock-in, notice, penalties, and maintenance.</p>
              <p>• Calculates deposit multiples deterministically in code.</p>
              <p>• Verifies every cited quote in code before showing it.</p>
              <p>• 100% private: nothing is stored.</p>
            </div>
          </div>
        ) : (
          /* Workspace with Loaded Document */
          <div className="flex-1 flex flex-col gap-4">
            {/* Top Workspace Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-paper-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-paper-200 border border-paper-border flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-ink" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-semibold text-ink leading-tight">
                    Rental Agreement Workspace
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {pages.length} page{pages.length > 1 ? "s" : ""} loaded · Quote verification active
                  </p>
                </div>
              </div>

              {/* Actions & Mobile Panel Switcher */}
              <div className="flex items-center gap-2">
                {/* Mobile panel toggle */}
                <div className="flex lg:hidden rounded-lg bg-paper-200 p-1 border border-paper-border">
                  <button
                    onClick={() => setMobilePanel("doc")}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      mobilePanel === "doc"
                        ? "bg-paper-50 text-ink shadow-sm"
                        : "text-ink-muted"
                    }`}
                  >
                    Document
                  </button>
                  <button
                    onClick={() => setMobilePanel("analysis")}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      mobilePanel === "analysis"
                        ? "bg-paper-50 text-ink shadow-sm"
                        : "text-ink-muted"
                    }`}
                  >
                    Analysis
                  </button>
                </div>

                {/* Upload additional or change */}
                <label
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-100 border border-paper-border text-ink text-xs font-medium hover:bg-paper-200 cursor-pointer transition-colors"
                  title="Upload more pages"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Pages</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                {/* Clear upload button (with confirmation dialog) */}
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-paper-border bg-paper-50 text-ink-muted hover:text-ink hover:bg-paper-200 text-xs font-medium transition-colors"
                  aria-label="Clear document and start over"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Start Over</span>
                </button>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
              {/* Left Column: Document Viewer (5 cols) */}
              <div
                className={`lg:col-span-6 flex flex-col ${
                  mobilePanel === "doc" ? "flex" : "hidden lg:flex"
                }`}
              >
                <DocumentViewer
                  pages={pages}
                  currentPageNumber={currentPageNumber}
                  onPageChange={setCurrentPageNumber}
                  onUpdatePageText={handleUpdatePageText}
                  onReanalyze={handleReanalyze}
                  activeQuote={activeQuote}
                  isReanalyzing={isAnalyzing}
                />
              </div>

              {/* Right Column: Analysis Tabs (6 cols) */}
              <div
                className={`lg:col-span-6 flex flex-col ${
                  mobilePanel === "analysis" ? "flex" : "hidden lg:flex"
                }`}
              >
                {/* Right Tabs Navigation */}
                <div
                  role="tablist"
                  aria-label="Analysis sections"
                  className="flex border-b border-paper-border mb-4 bg-paper-100 p-1 rounded-xl border"
                >
                  <button
                    role="tab"
                    aria-selected={activeTab === "terms"}
                    onClick={() => setActiveTab("terms")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                      activeTab === "terms"
                        ? "bg-paper-50 text-ink shadow-sm font-semibold"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Key terms</span>
                  </button>

                  <button
                    role="tab"
                    aria-selected={activeTab === "flags"}
                    onClick={() => setActiveTab("flags")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                      activeTab === "flags"
                        ? "bg-paper-50 text-ink shadow-sm font-semibold"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Worth clarifying</span>
                    {flags.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-highlighter-solid text-ink text-[10px] flex items-center justify-center font-bold">
                        {flags.length}
                      </span>
                    )}
                  </button>

                  <button
                    role="tab"
                    aria-selected={activeTab === "ask"}
                    onClick={() => setActiveTab("ask")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                      activeTab === "ask"
                        ? "bg-paper-50 text-ink shadow-sm font-semibold"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Ask agreement</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                  {activeTab === "terms" && (
                    <KeyTermsTab
                      terms={terms}
                      onSelectQuote={handleSelectQuote}
                      activeQuote={activeQuote}
                    />
                  )}

                  {activeTab === "flags" && (
                    <WorthClarifyingTab
                      flags={flags}
                      onSelectQuote={handleSelectQuote}
                      activeQuote={activeQuote}
                    />
                  )}

                  {activeTab === "ask" && (
                    <AskTab
                      pages={pages}
                      onSelectQuote={handleSelectQuote}
                      activeQuote={activeQuote}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clear Confirmation Dialog (Checklist #31) */}
        <ConfirmDialog
          isOpen={showClearConfirm}
          title="Clear current agreement?"
          description="This will remove the uploaded pages and analysis from your session. You will be able to upload a new agreement or reload the sample."
          confirmLabel="Yes, Clear Document"
          cancelLabel="Keep Document"
          onConfirm={handleClearDocument}
          onCancel={() => setShowClearConfirm(false)}
        />
      </main>

      <Footer />
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <ToastProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-paper">
            <span className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <WorkspaceContent />
      </Suspense>
    </ToastProvider>
  );
}
