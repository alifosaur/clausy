"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  SearchX,
  FileCheck2,
  Trash2,
  AlertCircle,
  X,
  FileImage,
} from "lucide-react";
import { health } from "@/lib/api";
import { useDocumentFiles } from "@/components/DocumentContext";
import { useToast } from "@/components/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface SelectedFileItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function HomePage() {
  const router = useRouter();
  const { setFiles: setContextFiles } = useDocumentFiles();
  const { showToast } = useToast();

  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // WARM-UP: on first load of "/", call health() once in the background to wake backend.
  // Silently ignore failures, show nothing in UI, skip when NEXT_PUBLIC_USE_MOCK is true.
  useEffect(() => {
    const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    if (!isMock) {
      health().catch(() => {
        // Silently ignore warmup error
      });
    }
  }, []);

  // Clean up object URLs when unmounted or files removed
  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [selectedFiles]);

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setValidationError(null);
    const newItems: SelectedFileItem[] = [];
    const currentCount = selectedFiles.length;

    if (currentCount + incomingFiles.length > MAX_FILES) {
      const msg = `Maximum ${MAX_FILES} pages allowed per agreement. You currently have ${currentCount}.`;
      setValidationError(msg);
      showToast(msg, "error");
      return;
    }

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];

      // Validate MIME type
      const isJpg = file.type === "image/jpeg" || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg");
      const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");

      if (!isJpg && !isPng) {
        const msg = `"${file.name}" is not supported. Please upload JPG or PNG images only.`;
        setValidationError(msg);
        showToast(msg, "error");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const msg = `"${file.name}" exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
        setValidationError(msg);
        showToast(msg, "error");
        return;
      }

      // Check duplicates by name and size
      const isDuplicate = selectedFiles.some(
        (existing) => existing.file.name === file.name && existing.file.size === file.size
      );
      if (isDuplicate) {
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
        file,
        previewUrl,
      });
    }

    if (newItems.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newItems]);
      showToast(`Added ${newItems.length} agreement page${newItems.length > 1 ? "s" : ""}`, "success");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      // Reset input value so same files can be re-selected if removed
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
    setValidationError(null);
  };

  const handleClearAllConfirm = () => {
    selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setSelectedFiles([]);
    setValidationError(null);
    setShowClearConfirm(false);
    showToast("All uploaded pages removed", "info");
  };

  const handleReadAgreement = () => {
    if (selectedFiles.length === 0) return;

    // Store File objects in client-side React context (memory only)
    const rawFiles = selectedFiles.map((item) => item.file);
    setContextFiles(rawFiles);

    // Navigate to workspace
    router.push("/workspace");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* HERO SECTION */}
      <section className="pt-14 pb-18 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-200 border border-paper-border text-xs text-ink-muted mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-highlighter-solid border border-ink" />
          <span className="font-mono uppercase tracking-wider text-[11px]">
            Gemma 4 · Rental Agreement Reader
          </span>
        </div>

        {/* Main Headline with Marker Stroke Effect */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-ink tracking-tight leading-[1.1] mb-6">
          Know{" "}
          <span className="relative inline-block px-1">
            <span className="relative z-10">what you&apos;re signing.</span>
            <span
              className="absolute inset-x-0 bottom-1 sm:bottom-2 h-3 sm:h-5 bg-highlighter-solid/80 -z-0 rounded-sm transform -rotate-0.5"
              aria-hidden="true"
            />
          </span>
        </h1>

        {/* Subline */}
        <p className="text-base sm:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed mb-10">
          Clausy reads your rental agreement, shows the exact clause behind every answer, and tells you when the document doesn&apos;t say.
        </p>

        {/* Primary Action Button */}
        <div className="flex justify-center mb-10">
          <Link
            href="/workspace?sample=1"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-ink text-paper text-base font-medium hover:bg-ink-deep transition-all shadow-paper focus-visible:ring-2 focus-visible:ring-ink"
          >
            <Sparkles className="w-5 h-5 text-highlighter-solid" />
            <span>Try the sample agreement</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Upload Dropzone Container */}
        <div className="max-w-xl mx-auto bg-paper-50 border border-paper-border rounded-2xl p-5 sm:p-7 shadow-paper-lg text-left">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-paper-border">
            <h2 className="font-serif text-base font-semibold text-ink">
              Upload your own pages
            </h2>
            <span className="text-xs font-mono text-ink-muted">
              JPG or PNG · Up to 5 files (max 10 MB)
            </span>
          </div>

          {/* Drag & Drop Area */}
          <div
            tabIndex={0}
            role="button"
            aria-label="Upload agreement photos dropzone. Press Enter or Space to browse files."
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none ${
              isDragging
                ? "border-ink bg-highlighter-solid/25 shadow-sm"
                : "border-paper-border hover:border-paper-border-dark bg-paper-100/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png"
              onChange={handleFileInputChange}
              className="sr-only"
              aria-hidden="true"
            />

            <UploadCloud className="w-9 h-9 text-ink mx-auto mb-2" />
            <p className="text-sm font-medium text-ink">
              Click to browse, or drag & drop agreement pages
            </p>
            <p className="text-xs text-ink-muted mt-1">
              Supports camera photos (JPG, PNG) up to 10 MB each
            </p>
          </div>

          {/* Validation Error State */}
          {validationError && (
            <div
              role="alert"
              className="mt-3 p-3 rounded-xl bg-paper-200 border border-paper-border text-xs text-ink flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{validationError}</div>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-ink-muted hover:text-ink p-0.5 rounded"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Selected Files List with Thumbnails & Remove Actions */}
          {selectedFiles.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="font-mono uppercase tracking-wider text-[11px]">
                  Selected Pages ({selectedFiles.length}/{MAX_FILES})
                </span>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-1 text-ink-muted hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </button>
              </div>

              <ul className="space-y-2" aria-label="Uploaded agreement pages">
                {selectedFiles.map((item, idx) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-paper-100 border border-paper-border text-xs text-ink"
                  >
                    <div className="flex items-center gap-3 truncate">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={`Thumbnail preview of agreement page ${idx + 1}: ${item.file.name}`}
                        className="w-10 h-12 object-cover rounded border border-paper-border bg-paper-50 flex-shrink-0"
                      />
                      <div className="truncate">
                        <p className="font-medium truncate text-ink">
                          Page {idx + 1}: {item.file.name}
                        </p>
                        <p className="text-[11px] font-mono text-ink-muted">
                          {formatFileSize(item.file.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-paper-200 transition-colors focus-visible:ring-2 focus-visible:ring-ink flex-shrink-0"
                      aria-label={`Remove page ${idx + 1}: ${item.file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Button: Read My Agreement */}
          <div className="mt-5 pt-3 border-t border-paper-border">
            <button
              type="button"
              onClick={handleReadAgreement}
              disabled={selectedFiles.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-all shadow-paper disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>
                {selectedFiles.length === 0
                  ? "Select pages to read agreement"
                  : `Read my agreement (${selectedFiles.length} page${selectedFiles.length > 1 ? "s" : ""})`}
              </span>
            </button>
          </div>

          {/* Privacy Line */}
          <p className="text-[11px] text-ink-light text-center mt-3 leading-relaxed">
            Pages are sent to a hosted AI model to be read. Nothing is stored.
          </p>
        </div>
      </section>

      {/* SECTION 1: HOW IT WORKS (3 STEPS) */}
      <section
        className="py-16 sm:py-24 border-t border-paper-border bg-paper-100/60 px-4 sm:px-6 lg:px-8"
        aria-labelledby="how-it-works-title"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-widest text-ink-muted block mb-2">
              Three-Step Walkthrough
            </span>
            <h2
              id="how-it-works-title"
              className="font-serif text-3xl sm:text-4xl font-normal text-ink"
            >
              How Clausy Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Upload */}
            <article className="p-6 bg-paper-50 border border-paper-border rounded-2xl shadow-paper flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-paper-200 border border-paper-border flex items-center justify-center text-sm font-semibold text-ink font-mono mb-4">
                  1
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink mb-1.5">
                  Upload agreement pages
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Snap or drop up to 5 photos of your agreement pages. Pages are kept in memory and never stored in any database.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-ink-light flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5" />
                <span>Multi-page JPG / PNG</span>
              </div>
            </article>

            {/* Step 2: Understand */}
            <article className="p-6 bg-paper-50 border border-paper-border rounded-2xl shadow-paper flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-highlighter-solid/40 border border-paper-border flex items-center justify-center text-sm font-semibold text-ink font-mono mb-4">
                  2
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink mb-1.5">
                  Understand your terms
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Code verifies key terms, computes your deposit multiple of rent and notice coverage, and flags clauses worth asking your landlord about.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-ink-light flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Deterministic Money Card</span>
              </div>
            </article>

            {/* Step 3: Ask */}
            <article className="p-6 bg-paper-50 border border-paper-border rounded-2xl shadow-paper flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-paper-200 border border-paper-border flex items-center justify-center text-sm font-semibold text-ink font-mono mb-4">
                  3
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink mb-1.5">
                  Ask with verified citations
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Ask questions and see the exact cited clause highlighted with a yellow marker stroke in the original text, or a clear refusal if omitted.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-ink-light flex items-center gap-1.5">
                <SearchX className="w-3.5 h-3.5" />
                <span>Cited answers & honest refusal</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 2: TRUST STRIP */}
      <section
        className="py-14 sm:py-18 border-t border-paper-border bg-paper px-4 sm:px-6 lg:px-8"
        aria-labelledby="trust-strip-title"
      >
        <div className="max-w-5xl mx-auto">
          <h2 id="trust-strip-title" className="sr-only">
            Trust & Anti-Hallucination Guarantees
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {/* Trust Pillar 1 */}
            <div className="p-5 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-2">
              <ShieldCheck className="w-7 h-7 text-ink mx-auto" />
              <h3 className="font-serif text-base font-semibold text-ink">
                Every answer cites the clause
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Code cross-verifies every extracted quote against the original text. No invented clauses or numbers.
              </p>
            </div>

            {/* Trust Pillar 2 */}
            <div className="p-5 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-2">
              <SearchX className="w-7 h-7 text-ink mx-auto" />
              <h3 className="font-serif text-base font-semibold text-ink">
                Says &ldquo;not found&rdquo; instead of guessing
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                If your lease omits pet rules or subletting conditions, Clausy refuses to hallucinate and alerts you clearly.
              </p>
            </div>

            {/* Trust Pillar 3 */}
            <div className="p-5 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-2">
              <Sparkles className="w-7 h-7 text-ink mx-auto" />
              <h3 className="font-serif text-base font-semibold text-ink">
                Built on open-weight Gemma 4
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Powered by Google&apos;s open-weight Gemma architecture, run strictly from backend routes for tenant confidentiality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FINAL CALL-TO-ACTION */}
      <section
        className="py-16 sm:py-20 border-t border-paper-border bg-paper-200/50 px-4 sm:px-6 lg:px-8 text-center"
        aria-labelledby="cta-title"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-ink-muted block">
            Start Reading
          </span>
          <h2 id="cta-title" className="font-serif text-3xl sm:text-4xl font-normal text-ink tracking-tight">
            Review your rental terms in seconds.
          </h2>
          <p className="text-sm text-ink-muted max-w-xl mx-auto leading-relaxed">
            Test our verified Bengaluru rental agreement with pre-calculated money metrics and source clause citations.
          </p>

          <div className="pt-2">
            <Link
              href="/workspace?sample=1"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-all shadow-paper focus-visible:ring-2 focus-visible:ring-ink"
            >
              <Sparkles className="w-4 h-4 text-highlighter-solid" />
              <span>Try the sample agreement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Confirm Dialog: used when removing all files */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Remove all uploaded pages?"
        description="This will clear your selected agreement pages from memory. You can select new pages anytime."
        confirmLabel="Remove all"
        cancelLabel="Keep pages"
        onConfirm={handleClearAllConfirm}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
