from fastapi import APIRouter, File, UploadFile, Request
from app.models import ExtractResponse, Term, Flag
from app.core.ratelimit import limiter
from app.core.validate import validate_upload_files

router = APIRouter(tags=["Extract"])

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
        reason="Clause 7 mandates an automatic full one-month deduction for repainting irrespective of wear and tear, alongside Clause 3's commitment to refund upon peaceful handover.",
        quotes=[
            "Clause 3: The said deposit shall be refunded upon peaceful handover of vacant possession.",
            "Clause 7: Upon vacating the premises, one month's rent amounting to Rs. 32,000/- shall be deducted from the security deposit towards professional repainting and deep cleaning charges, irrespective of the physical condition of the walls.",
        ],
        question="Could we clarify if the painting deduction can be based on actual inspection invoices and prorated if the stay is short, rather than an automatic one-month deduction?",
    ),
    Flag(
        title="Immediate lease termination on 15-day delay vs lock-in liability",
        reason="Clause 4 allows the landlord to cancel the agreement after 15 days delay, while Clause 1 binds the tenant to pay full rent for the remaining 6-month lock-in.",
        quotes=[
            "Clause 1: The initial 6 (six) months shall be considered as an irrevocable lock-in period during which neither party can terminate the agreement without paying the full rent for the remaining lock-in period.",
            "Clause 4: In the event of delay in rent payment beyond the 5th of any month, a penal interest of 18% per annum calculated on daily basis shall be levied. Continued default of 15 days shall entitle the Lessor to terminate this lease immediately.",
        ],
        question="Could we clarify the grace period before lease termination, and confirm whether the lock-in penalty applies if the landlord terminates the lease early?",
    ),
    Flag(
        title="Notice period duration vs deposit refund turnaround",
        reason="Clause 6 requires a 2-month notice window from the tenant, but Clause 3 leaves the exact refund timeline for the deposit unspecified after key handover.",
        quotes=[
            "Clause 6: After the completion of the 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice or rent in lieu thereof.",
            "Clause 3: The said deposit shall be refunded upon peaceful handover of vacant possession.",
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
    Returns mock extraction response matching the data contract.
    """
    # Run strict file validation
    await validate_upload_files(files)

    # Return mock data conforming to data contract
    return ExtractResponse(
        terms=MOCK_EXTRACT_TERMS,
        flags=MOCK_EXTRACT_FLAGS,
    )
