# Clausy Backend ⚖️

Stateless FastAPI backend service for Clausy, handling document transcription, lease analysis, quote verification, and Gemma 4 model inference via Google's Gemini API.

---

## 🏛️ Architecture & Verification Boundary

```
[Uploaded Images] -> /extract -> [TRANSCRIBE (Gemma 4)] -> [extracted_text]
                                                               |
                                                               v
                                                    [ANALYZE (Gemma 4)]
                                                               |
                                                               v
                                                    [verify_quote (Code)]
                                                               |
                                                               v
[Filtered Flags & Terms] <------------------- [ExtractResponse]
```

1. **Gemma 4 Integration**:
   - Asynchronous HTTP client (`app/services/gemma.py`) using `httpx`.
   - Calls `{GEMMA_API_URL}/models/{GEMMA_MODEL}:generateContent` with `x-goog-api-key` header.
   - Default model: `gemma-4-26b-a4b-it` (Google Gemini API).
   - 60-second request timeout, automatic retry on 429 / 5xx with backoff.
   - Tolerant JSON parsing with code-fence stripping and automated single-attempt syntax repair retry.
   - Confidentiality: Never logs prompts, document text, images, or API keys.
2. **Deterministic Code Verification (`app/services/verify.py`)**:
   - `verify_quote(quote, source_text)`: String normalization and exact substring match against the raw extracted text.
   - Key terms not found in text are marked `verified=False`.
   - Flags whose quotes are not found in the extracted text are dropped.
   - Q&A answers marked `answered` without verified evidence are downgraded to `not_found`.
3. **Security & Prompt Injection Protection (`app/services/prompts.py`)**:
   - All document texts, images, and questions are treated as untrusted data.
   - Every prompt strictly instructs the model to ignore any instructions or overrides inside the document.
4. **Copy & Tone Rules**:
   - Flags use neutral wording: *"worth asking your landlord"*.
   - Strictly avoids judgmental claims like *"illegal"*, *"unfair"*, or *"overcharged"*.
   - No assumptions about what is "normal" in Bengaluru.

---

## ⚙️ Environment Configuration (`.env`)

Copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `GEMMA_API_KEY` | Secret Google Gemini API Key | `""` (required when `MOCK_MODE=false`) |
| `GEMMA_MODEL` | Target Gemma 4 model name | `gemma-4-26b-a4b-it` |
| `GEMMA_API_URL` | Base API endpoint URL | `https://generativelanguage.googleapis.com/v1beta` |
| `ALLOWED_ORIGINS` | Permitted CORS origins | `http://localhost:3000` |
| `MOCK_MODE` | Fallback to mock responses without calling API | `false` |

> Set `MOCK_MODE=true` for local offline development without a live API key.

---

## 🚀 Running Locally

1. **Activate virtual environment**:
```powershell
.venv\Scripts\Activate.ps1
```

2. **Install dependencies**:
```powershell
pip install -r requirements.txt
```

3. **Start the FastAPI server**:
```powershell
uvicorn app.main:app --reload --port 8000
```
Interactive OpenAPI documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 🔬 Diagnostic Script: `test_gemma.py`

To verify your Google Gemini API key and model connectivity directly with a single image:

```powershell
python scripts/test_gemma.py path/to/rental_agreement_page.jpg
```

This sends the image with the verbatim `TRANSCRIBE` prompt and outputs:
- Target model, endpoint, and masked key
- Response latency in seconds
- Raw response text from the model
- Parsed JSON structure

---

## 🧪 Testing

Run the automated pytest suite (22 unit & pipeline tests, 0 network dependencies):

```powershell
pytest
```

**Test Coverage**:
- Verified quotes retained with `verified=True`
- Fabricated quotes marked `verified=False`
- Fabricated flags with unverified quotes dropped
- Answered-without-evidence downgraded to `not_found`
- Malformed JSON repaired via automated repair instruction
- Upstream 429/500 errors mapped to friendly user messages without leaking keys
- File limit enforcement (rejects non-images, > 10 MB, > 5 files)
- Rate limiting (SlowAPI) and CORS verification
