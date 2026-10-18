from fastapi import APIRouter, Request
from app.models import AskRequest, Answer
from app.core.config import settings
from app.core.ratelimit import limiter
from app.core.validate import validate_question
from app.mock_data import get_mock_answer
from app.services.verify import verify_quote
from app.services.gemma import gemma_client

router = APIRouter(tags=["Ask"])


@router.post("/ask", response_model=Answer)
@limiter.limit("30/minute")
async def ask_question(
    request: Request,
    payload: AskRequest,
):
    """
    Answers questions based on agreement clauses.
    Validates question length (max 500 characters).
    Calls Gemma 4 ASK prompt or falls back to mock behavior when MOCK_MODE is enabled.
    Deterministically verifies every citation against the extracted text.
    If status is 'answered' but no quote is verified, downgrades to 'not_found'.
    """
    clean_q = validate_question(payload.question)
    source_text = payload.extracted_text or payload.text or ""

    # 1. Fallback to mock behavior when MOCK_MODE is enabled
    if settings.MOCK_MODE:
        return get_mock_answer(clean_q, source_text)

    # 2. Real Gemma 4 Call
    if not source_text.strip():
        return Answer(
            text="Not found in this agreement. No document text was provided to answer this question.",
            quotes=[],
            status="not_found",
        )

    ask_result = await gemma_client.ask(question=clean_q, extracted_text=source_text)
    raw_status = str(ask_result.get("status", "not_found")).lower()
    raw_text = str(ask_result.get("text", "")).strip()

    raw_quotes = ask_result.get("quotes", [])
    if isinstance(raw_quotes, str):
        raw_quotes = [raw_quotes]

    candidate_quotes = [str(q).strip() for q in raw_quotes if str(q).strip()]
    verified_quotes = [q for q in candidate_quotes if verify_quote(q, source_text)]

    if raw_status == "answered":
        # Strict code verification: if answered but no quote is verified, downgrade to not_found
        if not verified_quotes:
            return Answer(
                text="Not found in this agreement. The cited clauses could not be verified in the document text.",
                quotes=[],
                status="not_found",
            )
        return Answer(
            text=raw_text,
            quotes=verified_quotes,
            status="answered",
        )

    # Unmentioned / refused topic
    return Answer(
        text=raw_text or "Not found in this agreement. No clauses address this topic in the extracted document.",
        quotes=[],
        status="not_found",
    )
