# Clausy Backend ⚖️

Stateless FastAPI backend service for Clausy, handling document analysis, quote verification, and Gemma 4 model inference.

## Architecture & Boundary
- **FastAPI**: Provides endpoints for `GET /health`, `POST /extract`, and `POST /ask`.
- **Zero Storage**: Stateless in-memory processing. Documents and images are never stored to disk or database.
- **Quote Verification**: Deterministic code verification (`app/services/verify.py`) guarantees no hallucinations reach the tenant.

## Setup & Running Locally

1. Create and activate a Python 3.11+ virtual environment:
```powershell
python -m venv .venv
.venv\Scripts\activate
```

2. Install pinned dependencies:
```powershell
pip install -r requirements.txt
```

3. Environment configuration:
```powershell
copy .env.example .env
```
Configure your `GEMMA_API_KEY` and set `GEMMA_MODEL` to the chosen Gemma 4 model identifier.

4. Start the development server:
```powershell
uvicorn app.main:app --reload --port 8000
```

5. Run test suite:
```powershell
pytest
```
