from app.models import DocumentPage, Term, Flag, Answer, ExtractResponse
from app.services.verify import verify_quote

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


def get_mock_extract_response() -> ExtractResponse:
    """Returns the pre-computed ExtractResponse for mock mode or sample agreement."""
    return ExtractResponse(
        terms=MOCK_EXTRACT_TERMS,
        flags=MOCK_EXTRACT_FLAGS,
        extracted_text=MOCK_EXTRACTED_TEXT,
        rawText=MOCK_EXTRACTED_TEXT,
        pages=MOCK_EXTRACT_PAGES,
    )


def get_mock_answer(clean_q: str, source_text: str) -> Answer:
    """Returns deterministic mock Q&A responses when MOCK_MODE is active."""
    q_lower = clean_q.lower()

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

    # Default refusal contract for unmentioned topics
    return Answer(
        text="Not found in this agreement. No clauses address this topic in the extracted document.",
        quotes=[],
        status="not_found",
    )
