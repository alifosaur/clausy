import { ExtractResponse, AnswerItem, HealthResponse, ApiError } from "./types";
import { getMockHealth, getMockExtract, getMockAsk } from "./mock";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

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

/**
 * Uploads agreement page files (JPG/PNG) for extraction.
 * POST /extract
 */
export async function extract(files: File[]): Promise<ExtractResponse> {
  if (!files || files.length === 0) {
    throw new ApiError("No files provided for extraction", 400, "EMPTY_FILES");
  }

  if (USE_MOCK) {
    // Simulate brief processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return getMockExtract();
  }

  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await fetch(`${API_URL}/extract`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new ApiError(
        errorJson.detail || errorJson.error || `Extract failed with status ${res.status}`,
        res.status,
        "EXTRACT_FAILED",
        errorJson
      );
    }

    const data: ExtractResponse = await res.json();
    return data;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : "Failed to extract agreement";
    console.warn("API extract call failed, falling back to mock data:", msg);
    return getMockExtract();
  }
}

/**
 * Submits a question about the extracted rental agreement.
 * POST /ask
 */
export async function ask(question: string, extractedText?: string): Promise<AnswerItem> {
  const cleanQ = question.trim();
  if (!cleanQ) {
    throw new ApiError("Question cannot be empty", 400, "EMPTY_QUESTION");
  }

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
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
      throw new ApiError(
        errorJson.detail || errorJson.error || `Ask failed with status ${res.status}`,
        res.status,
        "ASK_FAILED",
        errorJson
      );
    }

    const data: AnswerItem = await res.json();
    return data;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : "Failed to answer question";
    console.warn("API ask call failed, falling back to mock matcher:", msg);
    return getMockAsk(cleanQ);
  }
}
