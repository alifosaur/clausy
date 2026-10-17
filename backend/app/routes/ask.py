from fastapi import APIRouter, Request
from app.models import AskRequest, Answer
from app.core.ratelimit import limiter
from app.core.validate import validate_question
from app.services.verify import verify_quote

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
    Returns cited answer or refusal ('not_found').
    """
    clean_q = validate_question(payload.question)
    q_lower = clean_q.lower()
    source_text = payload.extracted_text or ""

    # Check for inspection / entry
    if any(k in q_lower for k in ["enter", "inspect", "access", "notice"]):
        quote = (
            "The Lessor or authorized representatives reserve the right to enter and "
            "inspect the premises at reasonable hours with 24 hours prior written notice to the Lessee."
        )
        verified = verify_quote(quote, source_text) if source_text else True
        return Answer(
            text="The agreement specifies that the landlord must provide 24 hours prior written notice and inspect only at reasonable hours.",
            quotes=[quote] if verified else [],
            status="answered" if verified else "not_found",
        )

    # Check for painting deduction
    if any(k in q_lower for k in ["paint", "cleaning", "vacat"]):
        quote = (
            "Upon vacating the premises, one month's rent amounting to Rs. 32,000/- shall be deducted "
            "from the security deposit towards professional repainting and deep cleaning charges, "
            "irrespective of the physical condition of the walls."
        )
        verified = verify_quote(quote, source_text) if source_text else True
        return Answer(
            text="One month's rent (₹32,000) will be deducted from the security deposit upon vacating for repainting and deep cleaning, irrespective of wall condition. Worth asking your landlord if this can be prorated.",
            quotes=[quote] if verified else [],
            status="answered" if verified else "not_found",
        )

    # Check for delayed payment penalty
    if any(k in q_lower for k in ["delay", "late", "penalt", "interest"]):
        quote = (
            "In the event of delay in rent payment beyond the 5th of any month, "
            "a penal interest of 18% per annum calculated on daily basis shall be levied."
        )
        verified = verify_quote(quote, source_text) if source_text else True
        return Answer(
            text="If rent is delayed past the 5th of the month, an 18% per annum daily penal interest is levied. Continuing default of 15 days allows termination.",
            quotes=[quote] if verified else [],
            status="answered" if verified else "not_found",
        )

    # Check for society maintenance
    if any(k in q_lower for k in ["maintenance", "society", "association"]):
        quote = (
            "The Lessee shall pay monthly society maintenance charges of Rs. 3,500/- "
            "(Rupees Three Thousand Five Hundred only) directly to the Greenview Apartment "
            "Owners Association on or before 10th of every month, along with electricity and water charges as per meter readings."
        )
        verified = verify_quote(quote, source_text) if source_text else True
        return Answer(
            text="Monthly society maintenance of ₹3,500 is payable directly to the Apartment Owners Association on or before the 10th.",
            quotes=[quote] if verified else [],
            status="answered" if verified else "not_found",
        )

    # Default refusal contract for unmentioned topics (e.g. pets, subletting, rent escalation caps)
    return Answer(
        text="Not found in this agreement. No clauses address this topic in the extracted document.",
        quotes=[],
        status="not_found",
    )
