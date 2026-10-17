import base64
from fastapi import APIRouter, File, UploadFile, Request
from app.models import ExtractResponse, DocumentPage, Term, Flag
from app.core.config import settings
from app.core.ratelimit import limiter
from app.core.validate import validate_upload_files
from app.services.verify import verify_quote
from app.services.gemma import gemma_client

router = APIRouter(tags=["Extract"])

MOCK_EXTRACT_PAGES = [
    DocumentPage(
        page=1,
        pageNumber=1,
        text=(
            "RENTAL AGREEMENT\n\n"
            "This Rental Agreement is made and executed on this 1st day of October 2026 at Bengaluru between "
            "Mr. R. Sundaram (hereinafter called the LESSOR) and Mr. Ananya Sharma (hereinafter called the LESSEE).\n\n"
            "WHEREAS the Lessor is the absolute owner of Flat No. 402, Greenview Heights, Koramangala, Bengaluru.\n\n"
            "NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:\n\n"
            "1. TERM & LOCK-IN: The initial 6 (six) months shall be considered as an irrevocable lock-in period during which "
            "neither party can terminate the agreement without paying the full rent for the remaining lock-in period.\n\n"
            "2. RENT: The monthly rent for the schedule premises shall be Rs. 32,000/- (Rupees Thirty Two Thousand only) "
            "per month, payable in advance on or before the 5th day of each English calendar month through bank transfer.\n\n"
            "3. SECURITY DEPOSIT: The Lessee has deposited an interest-free refundable security deposit of Rs. 1,60,000/- "
            "(Rupees One Lakh Sixty Thousand only) with the Lessor, receipt of which is hereby acknowledged. "
            "The said deposit shall be refunded upon peaceful handover of vacant possession.\n\n"
            "4. DELAY PENALTIES: In the event of delay in rent payment beyond the 5th of any month, a penal interest of 18% "
            "per annum calculated on daily basis shall be levied. Continued default of 15 days shall entitle the Lessor "
            "to terminate this lease immediately."
        ),
    ),
    DocumentPage(
        page=2,
        pageNumber=2,
        text=(
            "5. MAINTENANCE CHARGES: The Lessee shall pay monthly society maintenance charges of Rs. 3,500/- "
            "(Rupees Three Thousand Five Hundred only) directly to the Greenview Apartment Owners Association on or before "
            "10th of every month, along with electricity and water charges as per meter readings.\n\n"
            "6. NOTICE PERIOD: After the completion of the 6-month lock-in period, either party may terminate this agreement "
            "by serving a 2 (two) months prior written notice or rent in lieu thereof.\n\n"
            "7. PAINTING DEDUCTION: Upon vacating the premises, one month's rent amounting to Rs. 32,000/- shall be deducted "
            "from the security deposit towards professional repainting and deep cleaning charges, irrespective of the physical "
            "condition of the walls.\n\n"
            "8. INSPECTION: The Lessor or authorized representatives reserve the right to enter and inspect the premises "
            "at reasonable hours with 24 hours prior written notice to the Lessee."
        ),
    ),
]

MOCK_EXTRACTED_TEXT = "\n\n".join(p.text for p in MOCK_EXTRACT_PAGES)

MOCK_EXTRACT_TERMS = [
    Term(
        key="rent",
        label="Monthly Rent",
        value="₹32,000",
        quote="The monthly rent for the schedule premises shall be Rs. 32,000/- (Rupees Thirty Two Thousand only) per month, payable in advance on or before the 5th day of each English calendar month through bank transfer.",
        page=1,
        verified=True,
    ),
    Term(
        key="deposit",
        label="Security Deposit",
        value="₹1,60,000",
        quote="The Lessee has deposited an interest-free refundable security deposit of Rs. 1,60,000/- (Rupees One Lakh Sixty Thousand only) with the Lessor, receipt of which is hereby acknowledged.",
        page=1,
        verified=True,
    ),
    Term(
        key="lock_in",
        label="Lock-in Period",
        value="6 months",
        quote="The initial 6 (six) months shall be considered as an irrevocable lock-in period during which neither party can terminate the agreement without paying the full rent for the remaining lock-in period.",
        page=1,
        verified=True,
    ),
    Term(
        key="notice_period",
        label="Notice Period",
        value="2 months",
        quote="After the completion of the 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice or rent in lieu thereof.",
        page=2,
        verified=True,
    ),
    Term(
        key="penalties",
        label="Late Payment Penalties",
        value="18% p.a. daily interest",
        quote="In the event of delay in rent payment beyond the 5th of any month, a penal interest of 18% per annum calculated on daily basis shall be levied.",
        page=1,
        verified=True,
    ),
    Term(
        key="maintenance",
        label="Society Maintenance",
        value="₹3,500/month",
        quote="The Lessee shall pay monthly society maintenance charges of Rs. 3,500/- (Rupees Three Thousand Five Hundred only) directly to the Greenview Apartment Owners Association on or before 10th of every month, along with electricity and water charges as per meter readings.",
        page=2,
        verified=True,
    ),
]

MOCK_EXTRACT_FLAGS = [
    Flag(
        title="Mandatory 1-month painting deduction regardless of wall condition",
        reason="Clause 7 mandates an automatic full one-month deduction for repainting irrespective of wear and tear, alongside Clause 3's commitment to refund upon peaceful handover. Worth asking your landlord if this can be prorated.",
        quotes=[
            "The said deposit shall be refunded upon peaceful handover of vacant possession.",
            "Upon vacating the premises, one month's rent amounting to Rs. 32,000/- shall be deducted from the security deposit towards professional repainting and deep cleaning charges, irrespective of the physical condition of the walls.",
        ],
        question="Could we clarify if the painting deduction can be based on actual inspection invoices and prorated if the stay is short, rather than an automatic one-month deduction?",
    ),
    Flag(
        title="Immediate lease termination on 15-day delay vs lock-in liability",
        reason="Clause 4 allows the landlord to cancel the agreement after 15 days delay, while Clause 1 binds the tenant to pay full rent for the remaining 6-month lock-in. Worth asking your landlord how these clauses interact.",
        quotes=[
            "The initial 6 (six) months shall be considered as an irrevocable lock-in period during which neither party can terminate the agreement without paying the full rent for the remaining lock-in period.",
            "In the event of delay in rent payment beyond the 5th of any month, a penal interest of 18% per annum calculated on daily basis shall be levied. Continued default of 15 days shall entitle the Lessor to terminate this lease immediately.",
        ],
        question="Could we clarify the grace period before lease termination, and confirm whether the lock-in penalty applies if the landlord terminates the lease early?",
    ),
    Flag(
        title="Notice period duration vs deposit refund turnaround",
        reason="Clause 6 requires a 2-month notice window from the tenant, but Clause 3 leaves the exact refund timeline for the deposit unspecified after key handover. Worth asking your landlord to confirm a refund schedule.",
        quotes=[
            "After the completion of the 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice or rent in lieu thereof.",
            "The said deposit shall be refunded upon peaceful handover of vacant possession.",
        ],
        question="Could we agree on a specific turnaround window (such as within 7 bank working days) for the security deposit refund following key handover?",
    ),
]


@router.post("/extract", response_model=ExtractResponse)
@limiter.limit("10/minute")
async def extract_agreement(
    request: Request,
    files: list[UploadFile] = File(...),
):
    """
    Extracts key terms and flags from uploaded agreement pages (up to 5 images).
    Validates magic bytes, file count, and file size.
    Calls Gemma 4 TRANSCRIBE and ANALYZE or returns mock responses if MOCK_MODE is enabled.
    """
    # 1. Run strict file validation
    await validate_upload_files(files)

    # 2. Return mock data when MOCK_MODE is active
    if settings.MOCK_MODE:
        return ExtractResponse(
            terms=MOCK_EXTRACT_TERMS,
            flags=MOCK_EXTRACT_FLAGS,
            extracted_text=MOCK_EXTRACTED_TEXT,
            rawText=MOCK_EXTRACTED_TEXT,
            pages=MOCK_EXTRACT_PAGES,
        )

    # 3. Read image files for multimodal Gemma 4 call
    images = []
    for f in files:
        content = await f.read()
        mime_type = f.content_type or "image/jpeg"
        images.append({
            "mime_type": mime_type,
            "data": base64.b64encode(content).decode("utf-8"),
        })

    # 4. Step 1: TRANSCRIBE once with all page images
    transcribe_result = await gemma_client.transcribe(images)
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
    analyze_result = await gemma_client.analyze(extracted_text)
    raw_terms = analyze_result.get("terms", [])
    raw_flags = analyze_result.get("flags", [])

    # 6. Verify term quotes deterministically against extracted text
    terms: list[Term] = []
    for t in raw_terms:
        if not isinstance(t, dict):
            continue
        quote = str(t.get("quote", "")).strip()
        verified = verify_quote(quote, extracted_text) if quote else False
        terms.append(Term(
            key=str(t.get("key", "other")),
            label=str(t.get("label", t.get("key", "Term"))),
            value=str(t.get("value", "")),
            quote=quote,
            page=int(t.get("page", 1)),
            verified=verified,
        ))

    # 7. Verify flag quotes and drop flags whose quotes are all unverified
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

    return ExtractResponse(
        terms=terms,
        flags=flags,
        extracted_text=extracted_text,
        rawText=extracted_text,
        pages=pages,
    )
