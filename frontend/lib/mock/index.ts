import { ExtractResponse, AnswerItem, HealthResponse } from "../types";
import {
  SAMPLE_PAGES,
  SAMPLE_TERMS,
  SAMPLE_FLAGS,
  PRESET_QUESTIONS,
  getSampleAskResponse,
} from "./sampleAgreement";

export {
  SAMPLE_PAGES,
  SAMPLE_TERMS,
  SAMPLE_FLAGS,
  PRESET_QUESTIONS,
  getSampleAskResponse,
};

export function getMockHealth(): HealthResponse {
  return {
    status: "ok",
    service: "clausy-mock-backend",
    gemmaReady: true,
    version: "1.0.0-mock",
    timestamp: new Date().toISOString(),
  };
}

export function getMockExtract(uploadedFiles?: File[]): ExtractResponse {
  if (uploadedFiles && uploadedFiles.length > 0) {
    const pages = uploadedFiles.map((file, idx) => {
      const sample = SAMPLE_PAGES[idx] || SAMPLE_PAGES[SAMPLE_PAGES.length - 1];
      let imageUrl: string | undefined = undefined;
      if (typeof window !== "undefined") {
        try {
          imageUrl = URL.createObjectURL(file);
        } catch {
          // ignore in SSR
        }
      }
      return {
        pageNumber: idx + 1,
        title: `Page ${idx + 1}: ${file.name}`,
        fileName: file.name,
        imageUrl,
        text: sample.text,
      };
    });

    return {
      terms: SAMPLE_TERMS,
      flags: SAMPLE_FLAGS,
      pages,
      rawText: pages.map((p) => p.text).join("\n\n"),
    };
  }

  return {
    terms: SAMPLE_TERMS,
    flags: SAMPLE_FLAGS,
    pages: SAMPLE_PAGES,
    rawText: SAMPLE_PAGES.map((p) => p.text).join("\n\n"),
  };
}

export function getMockAsk(question: string): AnswerItem {
  return getSampleAskResponse(question);
}
