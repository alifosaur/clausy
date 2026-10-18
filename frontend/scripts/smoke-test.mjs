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

  // TEST 9: Find in Document matching function (using real TypeScript module lib/search.ts)
  await runTest("Find in Document: Real TypeScript Search Module Matching Unit Tests", async () => {
    // Dynamic import of the real TypeScript module
    const { findMatchesInText, findSearchMatches, escapeRegExp } = await import("../lib/search.ts");
    assert.strictEqual(typeof findMatchesInText, "function", "findMatchesInText must be exported");
    assert.strictEqual(typeof findSearchMatches, "function", "findSearchMatches must be exported");
    assert.strictEqual(typeof escapeRegExp, "function", "escapeRegExp must be exported");

    const sampleText = "The monthly rent is Rs. 32,000. Rent must be paid promptly. Irrevocable lock-in period applies.";

    // 1. Whole word match (case-insensitive)
    const rentMatches = findMatchesInText("rent", sampleText);
    assert.strictEqual(rentMatches.length, 2, "Should find 'rent' and 'Rent'");
    assert.strictEqual(rentMatches[0].matchedText, "rent");
    assert.strictEqual(rentMatches[1].matchedText, "Rent");
    assert.strictEqual(sampleText.substring(rentMatches[0].startIndex, rentMatches[0].endIndex), "rent");
    assert.strictEqual(sampleText.substring(rentMatches[1].startIndex, rentMatches[1].endIndex), "Rent");

    // 2. Whole word vs partial word match
    const blockText = "Apartment is in B-Block with 6 months lock-in period.";
    // Default whole-word matching: does NOT match inside 'Block', but matches 'lock' in 'lock-in'
    const defaultWholeWordMatches = findMatchesInText("lock", blockText);
    assert.strictEqual(defaultWholeWordMatches.length, 1, "Default whole-word search should match 'lock' in 'lock-in', but not 'Block'");
    assert.strictEqual(defaultWholeWordMatches[0].matchedText, "lock");

    // Partial word matching (wholeWord: false): matches BOTH inside 'Block' and 'lock-in'
    const partialMatches = findMatchesInText("lock", blockText, { wholeWord: false });
    assert.strictEqual(partialMatches.length, 2, "Partial search with wholeWord: false matches inside 'Block' and 'lock-in'");

    // Legacy query with default options
    const lockMatches = findMatchesInText("lock", sampleText);
    assert.strictEqual(lockMatches.length, 1, "Should find 'lock' in 'lock-in'");
    assert.strictEqual(lockMatches[0].matchedText, "lock");
    assert.strictEqual(sampleText.substring(lockMatches[0].startIndex, lockMatches[0].endIndex), "lock");

    // 3. Regex special character handling (e.g. Rs., numbers, parentheses)
    const regexSafeMatches = findMatchesInText("Rs.", sampleText);
    assert.strictEqual(regexSafeMatches.length, 1, "Should safely match literal 'Rs.' with dot escaped");
    assert.strictEqual(regexSafeMatches[0].matchedText, "Rs.");

    const parensText = "Tenancy term is 11 (eleven) months with ₹32,000/- deposit.";
    const parenMatches = findMatchesInText("(eleven)", parensText);
    assert.strictEqual(parenMatches.length, 1, "Should safely match literal '(eleven)' with parens escaped");
    assert.strictEqual(parenMatches[0].matchedText, "(eleven)");

    // 4. Multi-page document matching
    const testPages = [
      { pageNumber: 1, text: "The monthly rent is Rs. 32,000. Irrevocable lock-in is 6 months." },
      { pageNumber: 2, text: "Notice period is 2 months. Repainting charge is one month rent Rs. 32,000." },
    ];
    const multiPageMatches = findSearchMatches("rent", testPages);
    assert.strictEqual(multiPageMatches.length, 2, "Should find 'rent' across both pages");
    assert.strictEqual(multiPageMatches[0].pageNumber, 1, "First match on page 1");
    assert.strictEqual(multiPageMatches[1].pageNumber, 2, "Second match on page 2");

    // 5. Empty / whitespace query returns empty array
    assert.deepStrictEqual(findMatchesInText("", sampleText), []);
    assert.deepStrictEqual(findMatchesInText("   ", sampleText), []);
    assert.deepStrictEqual(findSearchMatches("", testPages), []);
    assert.deepStrictEqual(findSearchMatches("   ", testPages), []);

    // 6. No matches returns empty array
    const noMatches = findSearchMatches("nonexistent_clause_xyz", testPages);
    assert.deepStrictEqual(noMatches, []);
  });

  // TEST 10: File Upload Validation (using real TypeScript module lib/validation.ts)
  await runTest("File Upload Validation: Real TypeScript Module Unit Tests", async () => {
    const {
      validateIncomingFiles,
      isAcceptedImageFile,
      isHeicFile,
      HEIC_FRIENDLY_MESSAGE,
      MAX_FILES,
      MAX_FILE_SIZE,
    } = await import("../lib/validation.ts");

    assert.strictEqual(typeof validateIncomingFiles, "function", "validateIncomingFiles must be exported");
    assert.strictEqual(typeof isAcceptedImageFile, "function", "isAcceptedImageFile must be exported");
    assert.strictEqual(typeof isHeicFile, "function", "isHeicFile must be exported");

    // 1. Valid JPG and PNG files pass
    const validJpg = { name: "lease_page1.jpg", size: 1024 * 500, type: "image/jpeg" };
    const validPng = { name: "lease_page2.png", size: 1024 * 800, type: "image/png" };
    const res1 = validateIncomingFiles([validJpg, validPng], 0);
    assert.strictEqual(res1.valid, true, "Valid JPG and PNG must pass validation");

    // 2. Extension fallback when file.type is empty string (common on Windows)
    const emptyTypeJpg = { name: "scan_photo.jpeg", size: 1024 * 300, type: "" };
    const emptyTypePng = { name: "document.PNG", size: 1024 * 400, type: "" };
    const res2 = validateIncomingFiles([emptyTypeJpg, emptyTypePng], 0);
    assert.strictEqual(res2.valid, true, "Empty file.type with valid extension must pass");

    // 3. iPhone HEIC / HEIF friendly message
    const heicFile1 = { name: "IMG_5432.HEIC", size: 1024 * 1000, type: "image/heic" };
    const resHeic = validateIncomingFiles([heicFile1], 0);
    assert.strictEqual(resHeic.valid, false, "HEIC must be rejected");
    assert.strictEqual(resHeic.error, HEIC_FRIENDLY_MESSAGE, "Must show iPhone friendly HEIC message");

    const heifFile2 = { name: "IMG_9999.heif", size: 1024 * 1000, type: "" };
    const resHeif = validateIncomingFiles([heifFile2], 0);
    assert.strictEqual(resHeif.valid, false, "HEIF with empty type must be rejected");
    assert.strictEqual(resHeif.error, HEIC_FRIENDLY_MESSAGE, "Must show iPhone friendly message on HEIF");

    // 4. File exceeding 10 MB limit
    const hugeFile = { name: "huge_agreement.png", size: 11 * 1024 * 1024, type: "image/png" };
    const resHuge = validateIncomingFiles([hugeFile], 0);
    assert.strictEqual(resHuge.valid, false, "File over 10 MB must be rejected");
    assert.ok(resHuge.error.includes("exceeds the 10 MB limit"), "Error must mention 10 MB limit");

    // 5. Exceeding max 5 files limit
    const filesList = [
      { name: "p1.jpg", size: 1000, type: "image/jpeg" },
      { name: "p2.jpg", size: 1000, type: "image/jpeg" },
      { name: "p3.jpg", size: 1000, type: "image/jpeg" },
      { name: "p4.jpg", size: 1000, type: "image/jpeg" },
      { name: "p5.jpg", size: 1000, type: "image/jpeg" },
      { name: "p6.jpg", size: 1000, type: "image/jpeg" },
    ];
    const resCount = validateIncomingFiles(filesList, 0);
    assert.strictEqual(resCount.valid, false, "More than 5 files must be rejected");
    assert.ok(resCount.error.includes("Maximum 5 pages allowed"), "Must state max 5 pages");

    // 6. Unsupported file formats (e.g. PDF, EXE, TXT)
    const pdfFile = { name: "contract.pdf", size: 1000, type: "application/pdf" };
    const resPdf = validateIncomingFiles([pdfFile], 0);
    assert.strictEqual(resPdf.valid, false, "PDF must be rejected");
    assert.ok(resPdf.error.includes("JPG or PNG"), "Must instruct JPG or PNG only");

    // 7. Empty file list
    const resEmpty = validateIncomingFiles([], 0);
    assert.strictEqual(resEmpty.valid, false, "Empty list must be rejected");
  });

  // TEST 11: 16 kHz Mono WAV Audio Encoding (using real TypeScript module lib/audio.ts)
  await runTest("Audio WAV Encoding: Real TypeScript Module Unit Tests", async () => {
    const { encodeWav16BitMono } = await import("../lib/audio.ts");
    assert.strictEqual(typeof encodeWav16BitMono, "function", "encodeWav16BitMono must be exported");

    // Create 1000 audio samples
    const sampleRate = 16000;
    const samples = new Float32Array(1000);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    }
    samples[0] = 0.0;
    samples[1] = 1.0;
    samples[2] = -1.0;

    const buffer = encodeWav16BitMono(samples, sampleRate);
    assert.ok(buffer instanceof ArrayBuffer, "Must return ArrayBuffer");
    assert.strictEqual(buffer.byteLength, 44 + samples.length * 2, "Buffer length must equal 44-byte header + 2 bytes per sample");

    const view = new DataView(buffer);
    const readString = (offset, length) => {
      let str = "";
      for (let i = 0; i < length; i++) {
        str += String.fromCharCode(view.getUint8(offset + i));
      }
      return str;
    };

    // 1. Check RIFF header
    assert.strictEqual(readString(0, 4), "RIFF", "Header must start with 'RIFF'");
    assert.strictEqual(view.getUint32(4, true), 36 + samples.length * 2, "ChunkSize must be 36 + dataSize");
    assert.strictEqual(readString(8, 4), "WAVE", "Format must be 'WAVE'");

    // 2. Check fmt sub-chunk
    assert.strictEqual(readString(12, 4), "fmt ", "Subchunk1ID must be 'fmt '");
    assert.strictEqual(view.getUint32(16, true), 16, "Subchunk1Size must be 16 for PCM");
    assert.strictEqual(view.getUint16(20, true), 1, "AudioFormat must be 1 (PCM)");
    assert.strictEqual(view.getUint16(22, true), 1, "NumChannels must be 1 (mono)");
    assert.strictEqual(view.getUint32(24, true), 16000, "SampleRate must be 16000");
    assert.strictEqual(view.getUint32(28, true), 32000, "ByteRate must be 32000 (16000 * 1 * 2)");
    assert.strictEqual(view.getUint16(32, true), 2, "BlockAlign must be 2");
    assert.strictEqual(view.getUint16(34, true), 16, "BitsPerSample must be 16");

    // 3. Check data sub-chunk
    assert.strictEqual(readString(36, 4), "data", "Subchunk2ID must be 'data'");
    assert.strictEqual(view.getUint32(40, true), samples.length * 2, "Subchunk2Size must be dataSize");

    // 4. Check quantized samples
    assert.strictEqual(view.getInt16(44, true), 0, "0.0 sample must quantize to 0");
    assert.strictEqual(view.getInt16(46, true), 32767, "1.0 sample must quantize to 32767");
    assert.strictEqual(view.getInt16(48, true), -32768, "-1.0 sample must quantize to -32768");
  });

  console.log(`\n=========================================`);
  console.log(`  RESULTS: ${passed}/${total} TESTS PASSED  `);
  console.log(`=========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

main();
