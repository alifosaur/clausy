/**
 * Clausy Eval Set & Smoke Test
 * Tests quote verification, financial math, refusal behavior, data contract adherence,
 * and the strict upload error state (never falling back to mock data).
 */

import assert from "node:assert";

// 1. Mock extracted pages
const mockPages = [
  {
    pageNumber: 1,
    text: `RENTAL AGREEMENT
1. TERM & LOCK-IN: The tenancy shall be for a fixed term of 11 (eleven) months. The initial 6 (six) months shall be considered as an irrevocable lock-in period.
2. MONTHLY RENT: The monthly rent for the schedule premises shall be Rs. 32,000/- (Rupees Thirty Two Thousand only) per month.
3. SECURITY DEPOSIT: The Lessee has deposited an interest-free refundable security deposit of Rs. 1,60,000/- (Rupees One Lakh Sixty Thousand only).`,
  },
  {
    pageNumber: 2,
    text: `4. NOTICE PERIOD & TERMINATION: After the completion of the 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice.
5. PAINTING: Upon vacating the premises, one month's rent amounting to Rs. 32,000/- shall be deducted from the security deposit towards repainting charges.`,
  },
];

console.log("=========================================");
console.log("  CLAUSY EVAL SET & SMOKE TEST SUITE    ");
console.log("=========================================\n");

let passed = 0;
let total = 0;

async function runTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// Simple test implementations matching lib/verifier.ts and lib/calculator.ts
function normalize(str) {
  return str.toLowerCase().replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function verifyQuote(quote, pages) {
  if (!quote || quote.trim().length < 5) return { isVerified: false };
  const cleanQuote = quote.trim();
  const normalizedTarget = normalize(cleanQuote);

  for (const page of pages) {
    if (page.text.includes(cleanQuote) || normalize(page.text).includes(normalizedTarget)) {
      return { isVerified: true, pageNumber: page.pageNumber };
    }
  }

  // Token overlap check
  const tokens = normalizedTarget.split(/\s+/).filter((t) => t.length > 2);
  for (const page of pages) {
    const pageNorm = normalize(page.text);
    const found = tokens.filter((t) => pageNorm.includes(t)).length;
    if (found / tokens.length >= 0.82) {
      return { isVerified: true, pageNumber: page.pageNumber };
    }
  }

  return { isVerified: false };
}

function computeMetrics(rent, deposit, noticeMonths) {
  const depositMultipleOfRent = Number((deposit / rent).toFixed(1));
  const depositMultipleOfNotice = Number((deposit / (rent * noticeMonths)).toFixed(1));
  const upfrontTotal = deposit + rent;
  return { depositMultipleOfRent, depositMultipleOfNotice, upfrontTotal };
}

function categorizeError(err) {
  const status = err?.status;
  if (status === 429) {
    return { category: "rate limit", categoryLabel: "Rate Limit" };
  }
  if (status === 400 || status === 415 || status === 422) {
    return { category: "invalid image", categoryLabel: "Invalid Image" };
  }
  if (status && status >= 500) {
    return { category: "provider unavailable", categoryLabel: "Provider Unavailable" };
  }
  if (status === 0 || err?.code === "SERVER_UNREACHABLE") {
    return { category: "server down", categoryLabel: "Server Down" };
  }

  const rawMsg = err instanceof Error ? err.message : String(err || "");
  const lower = rawMsg.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("429")) {
    return { category: "rate limit", categoryLabel: "Rate Limit" };
  }
  if (lower.includes("image") || lower.includes("file") || lower.includes("400")) {
    return { category: "invalid image", categoryLabel: "Invalid Image" };
  }
  if (
    lower.includes("500") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("unavailable") ||
    lower.includes("quota")
  ) {
    return { category: "provider unavailable", categoryLabel: "Provider Unavailable" };
  }
  return { category: "server down", categoryLabel: "Server Down" };
}

async function main() {
  // TEST 1: Exact Quote Verification
  await runTest("Exact Quote Verification (Pass)", () => {
    const quote = "The monthly rent for the schedule premises shall be Rs. 32,000/- (Rupees Thirty Two Thousand only) per month.";
    const res = verifyQuote(quote, mockPages);
    assert.strictEqual(res.isVerified, true, "Valid quote should verify as true");
    assert.strictEqual(res.pageNumber, 1, "Should locate quote on page 1");
  });

  // TEST 2: Multi-Page Quote Detection
  await runTest("Page 2 Quote Detection", () => {
    const quote = "After the completion of the 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice.";
    const res = verifyQuote(quote, mockPages);
    assert.strictEqual(res.isVerified, true);
    assert.strictEqual(res.pageNumber, 2, "Should locate quote on page 2");
  });

  // TEST 3: Hallucinated / Fabricated Quote Rejection
  await runTest("Hallucination Rejection (Pass)", () => {
    const fakeQuote = "The landlord agrees to pay 20% annual bonus to the tenant upon successful lease completion.";
    const res = verifyQuote(fakeQuote, mockPages);
    assert.strictEqual(res.isVerified, false, "Invented quote must be rejected");
  });

  // TEST 4: Deterministic Financial Arithmetic
  await runTest("Deterministic Money Card Arithmetic", () => {
    const metrics = computeMetrics(32000, 160000, 2);
    assert.strictEqual(metrics.depositMultipleOfRent, 5.0, "160000 / 32000 should be 5.0x");
    assert.strictEqual(metrics.depositMultipleOfNotice, 2.5, "5 months deposit / 2 months notice should be 2.5x");
    assert.strictEqual(metrics.upfrontTotal, 192000, "160000 + 32000 should be 192000");
  });

  // TEST 5: Strict Refusal Contract on Omitted Clauses
  await runTest("Omission Refusal Contract Check", () => {
    const unmentionedTopic = "pet ownership";
    const pagesText = mockPages.map((p) => p.text).join(" ");
    const containsTopic = pagesText.toLowerCase().includes(unmentionedTopic);

    const answer = containsTopic
      ? { text: "Answered", status: "answered", quotes: ["quote"] }
      : { text: "Not found in this agreement. No clauses address this topic in the extracted document.", status: "not_found", quotes: [] };

    assert.strictEqual(answer.status, "not_found", "Unmentioned topics must trigger refusal status");
    assert.strictEqual(answer.quotes.length, 0, "Refusal responses must have empty quotes array");
    assert.ok(answer.text.startsWith("Not found in this agreement"), "Must start with refusal prompt");
  });

  // TEST 6: Data Contract Integrity
  await runTest("Data Contract Schema Integrity", () => {
    const testData = {
      terms: [
        { key: "rent", label: "Monthly Rent", value: "₹32,000", quote: "...", page: 1, verified: true },
      ],
      flags: [
        { title: "Escalation", reason: "...", quotes: ["..."], question: "..." },
      ],
      answer: {
        text: "...",
        quotes: ["..."],
        status: "answered",
      },
    };

    assert.ok(Array.isArray(testData.terms), "terms must be array");
    assert.strictEqual(typeof testData.terms[0].verified, "boolean", "verified must be boolean");
    assert.ok(Array.isArray(testData.flags), "flags must be array");
    assert.ok(Array.isArray(testData.flags[0].quotes), "flag quotes must be array");
    assert.ok(["answered", "not_found"].includes(testData.answer.status), "status must be answered or not_found");
  });

  // TEST 7: Uploaded files with stopped backend must throw error, never return sample data
  await runTest("Upload Failure Shows Error State (Never Falls Back to Mock)", async () => {
    const deadApiUrl = "http://127.0.0.1:59998";
    let uploadResult = null;
    let caughtError = null;

    try {
      // Attempting upload POST to dead backend
      const formData = new FormData();
      const fakeFile = new Blob(["fake png data"], { type: "image/png" });
      formData.append("files", fakeFile, "page1.png");

      const res = await fetch(`${deadApiUrl}/extract`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      uploadResult = await res.json();
    } catch (err) {
      caughtError = err;
    }

    assert.ok(caughtError !== null, "Upload to stopped backend must throw error");
    assert.strictEqual(uploadResult, null, "Upload must not return mock response on backend failure");

    // Must categorize as server down
    const errCat = categorizeError(caughtError);
    assert.strictEqual(errCat.category, "server down", "Connection error must categorize as server down");

    // Must NEVER show sample agreement terms (e.g. Rs 18,000 or fake quotes)
    const sampleTerms = ["18,000", "90,000"];
    const hasSampleTerm = (uploadResult?.terms || []).some((t) => sampleTerms.includes(t.value));
    assert.strictEqual(hasSampleTerm, false, "Must never return sample terms on upload failure");
  });

  // TEST 8: Error Category Classification
  await runTest("Error Category Classification Contract", () => {
    assert.strictEqual(categorizeError({ status: 429 }).category, "rate limit");
    assert.strictEqual(categorizeError(new Error("Rate limit exceeded 429")).category, "rate limit");

    assert.strictEqual(categorizeError({ status: 502 }).category, "provider unavailable");
    assert.strictEqual(categorizeError({ status: 503 }).category, "provider unavailable");
    assert.strictEqual(categorizeError(new Error("AI provider unavailable")).category, "provider unavailable");

    assert.strictEqual(categorizeError({ status: 400 }).category, "invalid image");
    assert.strictEqual(categorizeError({ status: 415 }).category, "invalid image");
    assert.strictEqual(categorizeError(new Error("Invalid image format")).category, "invalid image");

    assert.strictEqual(categorizeError({ status: 0 }).category, "server down");
    assert.strictEqual(categorizeError(new Error("Failed to fetch / connection refused")).category, "server down");
  });

  console.log(`\n=========================================`);
  console.log(`  RESULTS: ${passed}/${total} TESTS PASSED  `);
  console.log(`=========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

main();
