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
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previously focused element to return focus on close
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    // Focus the first focusable element or dialog container
    const dialog = dialogRef.current;
    if (dialog) {
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }

      // Focus trapping logic
      if (e.key === "Tab" && dialog) {
        const focusables = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
    };
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
          type="button"
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
