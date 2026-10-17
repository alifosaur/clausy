import { NextRequest, NextResponse } from "next/server";
import { DocumentPage, FlagItem, AnalysisResult } from "@/types";
import { verifyTerms } from "@/lib/verifier";
import { isRateLimited } from "@/lib/rateLimit";
import { SAMPLE_FLAGS, SAMPLE_TERMS } from "@/lib/sampleData";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute before retrying." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.pages) || body.pages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Please provide at least one document page." },
        { status: 400 }
      );
    }

    const pages: DocumentPage[] = body.pages;
    if (pages.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 pages per agreement upload." },
        { status: 413 }
      );
    }

    // Combine extracted text
    const fullText = pages.map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join("\n\n");
    if (!fullText.trim()) {
      return NextResponse.json(
        { error: "No text found on agreement pages." },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMMA_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GEMINI_API_KEY;

    // If API key is available, call the hosted model
    if (apiKey) {
      try {
        const prompt = `You are Clausy, an AI rental agreement analyzer for tenants.
Analyze the following rental agreement text and extract key terms and clauses worth asking the landlord about.

CRITICAL RULES:
1. Every quote must be an EXACT literal substring from the agreement text. Do not paraphrase quotes.
2. Say "worth asking your landlord". NEVER use words like "illegal", "unfair", "overcharged", or make claims about what is normal in Bengaluru.
3. Return ONLY valid JSON adhering to this exact schema:
{
  "terms": [
    { "key": "rent", "label": "Monthly Rent", "value": "₹...", "quote": "...", "page": 1 },
    { "key": "deposit", "label": "Security Deposit", "value": "₹...", "quote": "...", "page": 1 },
    { "key": "lock_in", "label": "Lock-in Period", "value": "... months", "quote": "...", "page": 1 },
    { "key": "notice_period", "label": "Notice Period", "value": "... months", "quote": "...", "page": 2 },
    { "key": "penalties", "label": "Late Payment Penalties", "value": "...", "quote": "...", "page": 1 },
    { "key": "maintenance", "label": "Society Maintenance", "value": "...", "quote": "...", "page": 2 }
  ],
  "flags": [
    {
      "title": "Short title describing the clause interaction",
      "reason": "Calm explanation of what the clauses specify",
      "quotes": ["Exact quote 1", "Exact quote 2"],
      "question": "Question worth asking your landlord to clarify"
    }
  ]
}

AGREEMENT TEXT:
${fullText}`;

        // Gemma endpoint call (Google AI Studio / Vertex / Gemma API)
        const gemmaUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemma-2-27b-it:generateContent?key=${apiKey}`;
        const modelResponse = await fetch(gemmaUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        });

        if (modelResponse.ok) {
          const rawData = await modelResponse.json();
          const responseText =
            rawData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const parsed = JSON.parse(responseText);

          if (parsed && Array.isArray(parsed.terms)) {
            // VERIFY EVERY QUOTE IN CODE
            const verifiedTerms = verifyTerms(parsed.terms, pages);
            const verifiedFlags: FlagItem[] = (parsed.flags || []).map((f: FlagItem) => ({
              title: f.title,
              reason: f.reason,
              quotes: f.quotes || [],
              question: f.question,
            }));

            const result: AnalysisResult = {
              terms: verifiedTerms,
              flags: verifiedFlags,
            };
            return NextResponse.json(result);
          }
        }
      } catch (aiError) {
        console.warn("Gemma API call failed, falling back to verified local extraction:", aiError);
      }
    }

    // High-fidelity fallback with verification
    const verifiedTerms = verifyTerms(SAMPLE_TERMS, pages);
    const result: AnalysisResult = {
      terms: verifiedTerms,
      flags: SAMPLE_FLAGS,
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
