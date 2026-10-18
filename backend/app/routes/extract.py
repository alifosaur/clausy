import time
import json
import base64
from fastapi import APIRouter, File, UploadFile, Request, Response
from app.models import ExtractResponse, DocumentPage, Term, Flag
from app.core.config import settings
from app.core.ratelimit import limiter
from app.core.validate import validate_upload_files
from app.core.image_proc import optimize_image
from app.services.verify import verify_quote, verify_term_value
from app.services.gemma import gemma_client
from app.mock_data import get_mock_extract_response

router = APIRouter(tags=["Extract"])


@router.post("/extract", response_model=ExtractResponse)
@limiter.limit("10/minute")
async def extract_agreement(
    request: Request,
    response: Response,
    files: list[UploadFile] = File(...),
):
    """
    Extracts key terms and flags from uploaded agreement pages (up to 5 images).
    Validates magic bytes, file count, and file size.
    Downscales to max 1280 px on longest side.
    Calls Gemma 4 TRANSCRIBE (concurrently up to 2 at a time for multi-page) and ANALYZE.
    Verifies quotes and values in code.
    Returns per-stage timing breakdown in X-Timing-Ms response header.
    """
    t_start = time.perf_counter()

    # 1. Run strict file validation
    validated_contents = await validate_upload_files(files)

    # 2. Return mock data when MOCK_MODE is active
    if settings.MOCK_MODE:
        timing_data = {"transcribe": 0, "analyze": 0, "verify": 0, "total": 0}
        response.headers["X-Timing-Ms"] = json.dumps(timing_data)
        return get_mock_extract_response()

    # 3. Optimize and encode image files for multimodal Gemma 4 call (max 1280 px)
    images = []
    for raw_content in validated_contents:
        opt_bytes, opt_mime = optimize_image(raw_content, max_longest_side=1280, quality=85)
        images.append({
            "mime_type": opt_mime,
            "data": base64.b64encode(opt_bytes).decode("utf-8"),
        })

    # 4. Step 1: TRANSCRIBE (concurrent with max 2 at a time if multi-page)
    t_transcribe_start = time.perf_counter()
    transcribe_result = await gemma_client.transcribe(images)
    transcribe_ms = int((time.perf_counter() - t_transcribe_start) * 1000)

    pages_data = transcribe_result.get("pages", [])
    if not isinstance(pages_data, list) or len(pages_data) == 0:
        pages_data = [{"page": 1, "text": ""}]

    pages: list[DocumentPage] = []
    for idx, p in enumerate(pages_data):
        page_num = int(p.get("page", idx + 1)) if isinstance(p, dict) else idx + 1
        page_text = str(p.get("text", "") if isinstance(p, dict) else p).strip()
        pages.append(DocumentPage(
            page=page_num,
            pageNumber=page_num,
            text=page_text,
        ))

    extracted_text = "\n\n".join(p.text for p in pages if p.text)

    # 5. Step 2: ANALYZE on extracted text
    t_analyze_start = time.perf_counter()
    analyze_result = await gemma_client.analyze(extracted_text)
    analyze_ms = int((time.perf_counter() - t_analyze_start) * 1000)

    raw_terms = analyze_result.get("terms", [])
    raw_flags = analyze_result.get("flags", [])

    # 6. Step 3: VERIFY term quotes & numeric values deterministically against extracted text
    t_verify_start = time.perf_counter()
    terms: list[Term] = []
    for t in raw_terms:
        if not isinstance(t, dict):
            continue
        quote = str(t.get("quote", "")).strip()
        val = str(t.get("value", ""))
        quote_verified = verify_quote(quote, extracted_text) if quote else False
        # Term is verified only if quote is in text AND all numbers in value appear in quote
        value_verified = verify_term_value(val, quote) if (quote_verified and val) else False
        verified = quote_verified and value_verified

        terms.append(Term(
            key=str(t.get("key", "other")),
            label=str(t.get("label", t.get("key", "Term"))),
            value=val,
            quote=quote,
            page=int(t.get("page", 1)),
            verified=verified,
        ))

    # Verify flag quotes and drop flags whose quotes are all unverified
    flags: list[Flag] = []
    for f in raw_flags:
        if not isinstance(f, dict):
            continue
        raw_quotes = f.get("quotes", [])
        if isinstance(raw_quotes, str):
            raw_quotes = [raw_quotes]

        flag_quotes = [str(q).strip() for q in raw_quotes if str(q).strip()]
        verified_flag_quotes = [q for q in flag_quotes if verify_quote(q, extracted_text)]

        # Drop flags whose quotes are all unverified
        if not verified_flag_quotes:
            continue

        flags.append(Flag(
            title=str(f.get("title", "Clause interaction worth clarifying")),
            reason=str(f.get("reason", "")),
            quotes=verified_flag_quotes,
            question=str(f.get("question", "")),
        ))

    verify_ms = int((time.perf_counter() - t_verify_start) * 1000)
    total_ms = int((time.perf_counter() - t_start) * 1000)

    # 7. Attach stage timings to response header
    timing_data = {
        "transcribe": transcribe_ms,
        "analyze": analyze_ms,
        "verify": verify_ms,
        "total": total_ms,
    }
    response.headers["X-Timing-Ms"] = json.dumps(timing_data)

    return ExtractResponse(
        terms=terms,
        flags=flags,
        extracted_text=extracted_text,
        rawText=extracted_text,
        pages=pages,
    )
