"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Clear & Start Over",
  cancelLabel = "Keep Document",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button when opened
    confirmBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md bg-paper-50 border border-paper-border rounded-2xl p-6 sm:p-7 shadow-paper-lg"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-paper-200 transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-highlighter-solid/40 border border-paper-border flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-ink" />
          </div>
          <div>
            <h2
              id="confirm-dialog-title"
              className="font-serif text-xl font-normal text-ink leading-snug"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-desc"
              className="text-sm text-ink-muted mt-1.5 leading-relaxed"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-paper-border bg-paper-100 text-ink text-sm font-medium hover:bg-paper-200 transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-deep transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
