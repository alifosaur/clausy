import {
  ExtractResponse,
  AnswerItem,
  HealthResponse,
  ApiError,
  AppLanguage,
  TranslateResponse,
  SpeakResponse,
  TranscribeResponse,
} from "./types";
import { getMockHealth, getMockExtract, getMockAsk, PRESET_QUESTIONS } from "./mock";

export { PRESET_QUESTIONS };

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export interface ExtractStats {
  status: number | string;
  durationMs: number;
  timestamp: number;
  timing?: {
    transcribe?: number;
    analyze?: number;
    verify?: number;
    total?: number;
  };
}

let lastExtractStats: ExtractStats | null = null;

export function getLastExtractStats(): ExtractStats | null {
  return lastExtractStats;
}

export function recordExtractStats(
  status: number | string,
  durationMs: number,
  timing?: ExtractStats["timing"]
) {
  lastExtractStats = { status, durationMs, timestamp: Date.now(), timing };
}

export type ReasonCategory = "rate limit" | "provider unavailable" | "invalid image" | "server down";

export interface CategorizedError {
  category: ReasonCategory;
  categoryLabel: string;
  message: string;
}

export function categorizeError(err: unknown): CategorizedError {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return {
        category: "rate limit",
        categoryLabel: "Rate Limit",
        message: err.message || "AI rate limit reached. Please wait a moment and try again.",
      };
    }
    if (err.status === 400 || err.status === 415 || err.status === 422) {
      let label = "Invalid Image";
      const msg = err.message || "";
      const lower = msg.toLowerCase();
      if (lower.includes("unsupported") || lower.includes("magic bytes") || lower.includes("type")) {
        label = "Unsupported Type";
      } else if (lower.includes("too large") || lower.includes("exceeds")) {
        label = "File Too Large";
      } else if (lower.includes("too many")) {
        label = "Too Many Files";
      } else if (lower.includes("empty")) {
        label = "Empty File";
      }
      return {
        category: "invalid image",
        categoryLabel: label,
        message: msg || "One or more uploaded pages could not be processed. Please check file format and size.",
      };
    }
    if (err.status && err.status >= 500) {
      return {
        category: "provider unavailable",
        categoryLabel: "Provider Unavailable",
        message: err.message || "The AI service is temporarily unavailable. Please try again.",
      };
    }
    if (err.status === 0 || err.code === "SERVER_UNREACHABLE") {
      return {
        category: "server down",
        categoryLabel: "Server Down",
        message: err.message || "Cannot connect to Clausy backend. Make sure the backend server is running on port 8000.",
      };
    }
  }

  const rawMsg = err instanceof Error ? err.message : String(err);
  const lower = rawMsg.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("429")) {
    return { category: "rate limit", categoryLabel: "Rate Limit", message: rawMsg };
  }
  if (lower.includes("image") || lower.includes("file") || lower.includes("400")) {
    return { category: "invalid image", categoryLabel: "Invalid Image", message: rawMsg };
  }
  if (
    lower.includes("500") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("unavailable") ||
    lower.includes("quota")
  ) {
    return { category: "provider unavailable", categoryLabel: "Provider Unavailable", message: rawMsg };
  }
  return {
    category: "server down",
    categoryLabel: "Server Down",
    message: rawMsg || "Cannot connect to Clausy backend.",
  };
}

/**
 * Checks backend health.
 * GET /health
 */
export async function health(): Promise<HealthResponse> {
  if (USE_MOCK) {
    return getMockHealth();
  }

  try {
    const res = await fetch(`${API_URL}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new ApiError(`Health check failed with status ${res.status}`, res.status, "HEALTH_CHECK_FAILED");
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : "Network error contacting backend";
    console.warn("Backend unreachable, falling back to mock health:", msg);
    return getMockHealth();
  }
}

export interface ExtractOptions {
  isSample?: boolean;
}

/**
 * Uploads agreement page files (JPG/PNG) for extraction.
 * Uploaded files ALWAYS call POST /extract on backend.
 * Mock data is used ONLY when isSample is true, and ONLY when NEXT_PUBLIC_USE_MOCK is true or backend is unreachable.
 * POST /extract
 */
export async function extract(files?: File[], options?: ExtractOptions): Promise<ExtractResponse> {
  const isSample = options?.isSample ?? (!files || files.length === 0);

  // 1. SAMPLE AGREEMENT PATH
  if (isSample) {
    if (USE_MOCK) {
      const start = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const durationMs = Math.round(performance.now() - start);
      recordExtractStats("200 (mock)", durationMs);
      return getMockExtract(files);
    }

    const start = performance.now();
    try {
      if (files && files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        const res = await fetch(`${API_URL}/extract`, { method: "POST", body: formData });
        const durationMs = Math.round(performance.now() - start);
        recordExtractStats(res.status, durationMs);
        if (!res.ok) {
          throw new ApiError(`Extract failed with status ${res.status}`, res.status);
        }
        return await res.json();
      } else {
        recordExtractStats("200 (sample)", 0);
        return getMockExtract();
      }
    } catch {
      recordExtractStats("200 (sample fallback)", 0);
      return getMockExtract();
    }
  }

  // 2. UPLOAD PATH (files provided by user, not sample)
  // Must ALWAYS call real backend POST /extract.
  // NEVER silently fall back to mock data.
  if (!files || files.length === 0) {
    throw new ApiError("No files provided for extraction", 400, "EMPTY_FILES");
  }

  const start = performance.now();
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await fetch(`${API_URL}/extract`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(120000),
    });

    const durationMs = Math.round(performance.now() - start);
    const timingHdr = res.headers.get("x-timing-ms") || res.headers.get("X-Timing-Ms");
    let timing: ExtractStats["timing"] = undefined;
    if (timingHdr) {
      try {
        timing = JSON.parse(timingHdr);
      } catch {}
    }
    recordExtractStats(res.status, durationMs, timing);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const detail = errorJson.detail || errorJson.error || `Server returned status ${res.status}`;
      throw new ApiError(detail, res.status, "EXTRACT_FAILED", errorJson);
    }

    const data: ExtractResponse = await res.json();
    return data;
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start);
    if (err instanceof ApiError) {
      recordExtractStats(err.status || "ERR", durationMs);
      throw err;
    }
    recordExtractStats("CONN_FAIL", durationMs);
    const msg = err instanceof Error ? err.message : "Failed to contact backend server";
    throw new ApiError(
      `Cannot connect to Clausy backend at ${API_URL}. Please ensure the backend server is running on port 8000. (${msg})`,
      0,
      "SERVER_UNREACHABLE"
    );
  }
}

export interface AskOptions {
  isSample?: boolean;
}

/**
 * Submits a question about the extracted rental agreement.
 * POST /ask
 */
export async function ask(
  question: string,
  extractedText?: string,
  options?: AskOptions
): Promise<AnswerItem> {
  const cleanQ = question.trim();
  if (!cleanQ) {
    throw new ApiError("Question cannot be empty", 400, "EMPTY_QUESTION");
  }

  const isSample = options?.isSample ?? false;

  // Mock ask allowed ONLY for sample agreement if USE_MOCK is true
  if (isSample && USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getMockAsk(cleanQ);
  }

  try {
    const res = await fetch(`${API_URL}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        question: cleanQ,
        text: extractedText || "",
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const detail = errorJson.detail || errorJson.error || `Ask failed with status ${res.status}`;
      throw new ApiError(detail, res.status, "ASK_FAILED", errorJson);
    }

    const data: AnswerItem = await res.json();
    return data;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    if (isSample) {
      console.warn("Backend unreachable for sample agreement ask, using mock matcher");
      return getMockAsk(cleanQ);
    }
    const msg = err instanceof Error ? err.message : "Network error contacting backend";
    throw new ApiError(
      `Failed to contact AI service for question: ${msg}`,
      0,
      "SERVER_UNREACHABLE"
    );
  }
}

/**
 * In-memory translation cache (per session, memory-only, no localStorage).
 * Key format: `${targetLanguage}:${originalText}`
 */
const translationCache = new Map<string, string>();

export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Translates an array of text snippets to target language ("kn" | "hi" | "en").
 * If target is "en", returns texts unmodified.
 * Uses in-memory cache to avoid duplicate translations.
 */
export async function translateTexts(
  texts: string[],
  target: AppLanguage
): Promise<string[]> {
  if (!texts || texts.length === 0 || target === "en") {
    return texts;
  }

  const results = new Array<string>(texts.length);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  texts.forEach((t, idx) => {
    if (!t || !t.trim()) {
      results[idx] = t;
      return;
    }
    const cacheKey = `${target}:${t}`;
    if (translationCache.has(cacheKey)) {
      results[idx] = translationCache.get(cacheKey)!;
    } else {
      uncachedIndices.push(idx);
      uncachedTexts.push(t);
    }
  });

  if (uncachedTexts.length === 0) {
    return results;
  }

  if (USE_MOCK) {
    uncachedTexts.forEach((t, i) => {
      const origIdx = uncachedIndices[i];
      const prefix = target === "kn" ? "[ಕನ್ನಡ] " : "[हिन्दी] ";
      const translated = `${prefix}${t}`;
      translationCache.set(`${target}:${t}`, translated);
      results[origIdx] = translated;
    });
    return results;
  }

  try {
    const res = await fetch(`${API_URL}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ texts: uncachedTexts, target }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new ApiError(errorJson.detail || `Translate failed with status ${res.status}`, res.status);
    }

    const data: TranslateResponse = await res.json();
    data.texts.forEach((translated, i) => {
      const origIdx = uncachedIndices[i];
      const origText = uncachedTexts[i];
      translationCache.set(`${target}:${origText}`, translated);
      results[origIdx] = translated;
    });

    return results;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : "Translation network error";
    throw new ApiError(`Translation failed: ${msg}`, 0, "TRANSLATE_FAILED");
  }
}

/**
 * Synthesizes text into spoken audio via Sarvam Bulbul v3.
 * Returns an audio data URI (data:audio/wav;base64,...) ready for playback.
 */
export async function speakText(text: string, lang: AppLanguage): Promise<string> {
  if (!text || !text.trim()) {
    throw new ApiError("Text cannot be empty", 400);
  }

  if (USE_MOCK) {
    return "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
  }

  const res = await fetch(`${API_URL}/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ text: text.slice(0, 800), lang }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new ApiError(errorJson.detail || `Speech synthesis failed with status ${res.status}`, res.status);
  }

  const data: SpeakResponse = await res.json();
  return `data:${data.content_type || "audio/wav"};base64,${data.audio}`;
}

/**
 * Transcribes audio blob using Sarvam Saaras v3.
 * Returns { text, language }.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  filename: string = "recording.webm"
): Promise<{ text: string; language: string }> {
  if (USE_MOCK) {
    return {
      text: "What is the security deposit refund timeline?",
      language: "en-IN",
    };
  }

  const formData = new FormData();
  formData.append("file", audioBlob, filename);

  const res = await fetch(`${API_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new ApiError(errorJson.detail || `Transcription failed with status ${res.status}`, res.status);
  }

  const data: TranscribeResponse = await res.json();
  return data;
}

