# Gemma 4 Live Verification Check Report 📜

**Status**: No successful model calls yet (quota error). No results, no latency, no model recommendation.

---

## 1. Summary of Execution

Synthetic agreement image assets (clean PNG and mobile-style messy JPEG) were generated from the ground truth text in `tests/data/sample_pages.json`.

During the live check, all requests dispatched to the Google Gemini API failed immediately at the provider edge with an HTTP 429 quota exhaustion error. Because zero requests were accepted by the upstream provider:
- **No successful model calls were completed.**
- **No inference results or extractions are available.**
- **No latency figures are reported** (reporting failed network roundtrip time as model inference latency is misleading).
- **No model recommendation is made** between `gemma-4-26b-a4b-it` and `gemma-4-31b-it` until live output comparisons can be evaluated.

---

## 2. Upstream Error Details (Redacted)

When calling `{GEMMA_API_URL}/models/{GEMMA_MODEL}:generateContent` or `GET {GEMMA_API_URL}/models`, Google's API returned the following response:

```json
{
  "error": {
    "code": 429,
    "message": "Quota exceeded for quota metric 'API requests' and limit 'Request limit per minute for a region' of service 'generativelanguage.googleapis.com' for consumer 'REDACTED'.",
    "status": "RESOURCE_EXHAUSTED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "RATE_LIMIT_EXCEEDED",
        "domain": "googleapis.com",
        "metadata": {
          "quota_limit_value": "0",
          "quota_location": "REDACTED",
          "quota_unit": "1/min/{project}/{region}",
          "consumer": "REDACTED",
          "quota_limit": "REDACTED",
          "service": "generativelanguage.googleapis.com",
          "quota_metric": "generativelanguage.googleapis.com/api_requests"
        }
      }
    ]
  }
}
```

---

## 3. Diagnosis & How to Resolve

The upstream response indicates `quota_limit_value: "0"`, meaning the Google Cloud project associated with this API key currently has zero allocated requests per minute for the Gemini API.

To resolve this and perform live extraction:
1. **New AI Studio Project**: Generate a fresh API key in [Google AI Studio](https://aistudio.google.com/) under a new project with active free-tier quota.
2. **Enable Billing / Increase Quota**: If using an existing Google Cloud project, ensure a billing account is linked or request a quota allocation for `generativelanguage.googleapis.com`.
3. **Local Offline Development**: Set `MOCK_MODE=true` in `backend/.env`. The backend will serve the full contract using mock agreement data without making external network calls.
