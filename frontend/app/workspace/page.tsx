import type { Metadata } from "next";
import { Suspense } from "react";
import { RotateCw } from "lucide-react";
import WorkspaceClient from "./WorkspaceClient";

export const metadata: Metadata = {
  title: "Rental Agreement Workspace — Clausy",
  description:
    "Interactive rental agreement reader with split document viewer, deterministic financial calculations, and verified clause Q&A.",
  alternates: {
    canonical: "/workspace",
  },
};

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
          <RotateCw className="w-8 h-8 text-ink animate-spin mb-3" />
          <p className="text-xs font-mono text-ink-muted">Loading workspace...</p>
        </div>
      }
    >
      <WorkspaceClient />
    </Suspense>
  );
}
