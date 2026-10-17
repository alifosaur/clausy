# Gemma 4 Live Verification Check Report 📜

**Status**: No successful model calls completed yet. Request failed at provider edge with quota exhaustion error (`QuotaNotAvailable`). No inference latency or term extractions have been fabricated.

---

## 1. Provider Compatibility Architecture

The backend now supports both **Google Gemini API** (`GEMMA_API_STYLE=gemini`) and **OpenAI-compatible endpoints** such as OpenRouter (`GEMMA_API_STYLE=openai`):
- **Gemini**: Calls `POST {GEMMA_API_URL}/models/{GEMMA_MODEL}:generateContent` with `x-goog-api-key`.
- **OpenAI / OpenRouter**: Calls `POST {GEMMA_API_URL}/chat/completions` with `Authorization: Bearer <key>`, `HTTP-Referer`, `X-Title: Clausy`, and multimodal `image_url` data URIs. Automatically handles tolerant JSON parsing and attempts `response_format: {"type": "json_object"}` with 400 fallback.

---

## 2. Live Check Execution & Measured Results

Following the required sequential test suite (stop at first failure):

| Step | Action | Status | Measured Outcome |
| :--- | :--- | :--- | :--- |
| **5a** | `python scripts/test_gemma.py tests/assets/clean/page1.png` | **FAILED** | Provider returned HTTP 429 (`QuotaNotAvailable`: limit 0) |
| **5b** | `python scripts/test_gemma.py tests/assets/messy/page1.jpg` | **STOPPED** | Not executed per stop-at-first-failure policy |
| **5c** | `python scripts/transcription_check.py` | **STOPPED** | Not executed |
| **5d** | `python scripts/e2e_check.py` | **STOPPED** | Not executed |

### Measured Metrics (Zero Fabricated Numbers)
- **Latency of Successful Calls**: **None** (0 successful calls; no inference latency recorded).
- **Transcription Similarity (Clean vs Messy)**: **None measured** (stopped before comparison).
- **Exact Key Values Found** (`18,000`, `90,000`, `6 months`, `2 months`, `2,200`, `18%`): **None found** (0/6 evaluated).
- **Terms Returned vs Expected**: **0 / 6** terms evaluated.
- **Verified Counts**: **0** verified.
- **Question Behavior (4 Questions: 2 Answerable, 2 Refusal)**: **None evaluated** (0/4 executed).
- **Specific Misreads on Messy Images**: **None recorded** (image inference was blocked by upstream quota).

---

## 3. Upstream Error Details (Redacted)

Upstream Google Gemini API returned an HTTP 429 quota exhaustion response:

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

## 4. Next Steps to Complete Live Check

To execute live inference with either provider:
1. **Via OpenRouter**:
   In `backend/.env`, configure:
   ```env
   GEMMA_API_STYLE=openai
   GEMMA_API_KEY=sk-or-v1-...
   GEMMA_API_URL=https://openrouter.ai/api/v1
   GEMMA_MODEL=google/gemma-4-26b-a4b-it
   ```
2. **Via Google AI Studio**:
   Create a fresh API key in [Google AI Studio](https://aistudio.google.com/) under a project with active free quota:
   ```env
   GEMMA_API_STYLE=gemini
   GEMMA_API_KEY=AQ...
   GEMMA_API_URL=https://generativelanguage.googleapis.com/v1beta
   GEMMA_MODEL=gemma-4-26b-a4b-it
   ```
3. **Local Offline Development**:
   Keep `MOCK_MODE=true` in `backend/.env` to run the full application and frontend contract without external API calls.

