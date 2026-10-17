import { DocumentPage, TermItem, FlagItem } from "@/types";

export const SAMPLE_PAGES: DocumentPage[] = [
  {
    pageNumber: 1,
    fileName: "bengaluru_rental_page_1.png",
    text: `RENTAL AGREEMENT
(E-Stamp Certificate No: IN-KA8829410192K / Stamp Duty Paid: ₹100/-)

This RENTAL AGREEMENT is entered into on this 1st day of November 2026 at Bengaluru, Karnataka:

BETWEEN:
Mr. R. Venkatesh Rao, aged about 54 years, residing at No. 42, 5th Cross, Indiranagar 1st Stage, Bengaluru - 560038, hereinafter referred to as the "LESSOR" (which expression shall mean and include his legal heirs, executors, and assigns) of the ONE PART;

AND:
Mr. Alok Sharma, aged about 28 years, currently residing at Bengaluru, hereinafter referred to as the "LESSEE" (which expression shall mean and include his legal heirs and representatives) of the OTHER PART.

WHEREAS the Lessor is the absolute owner of Flat No. 302, 3rd Floor, Greenview Residency, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038, comprising 2 Bedrooms, Hall, Kitchen, with one dedicated covered car parking space (hereinafter referred to as "SCHEDULE PREMISES").

NOW THIS AGREEMENT WITNESSETH AS UNDER:

1. TERM & LOCK-IN: The tenancy shall be for a fixed term of 11 (eleven) months commencing from 1st November 2026. The initial 6 (six) months shall be considered as an irrevocable lock-in period during which neither party can terminate the agreement without paying the full rent for the remaining lock-in period.

2. MONTHLY RENT: The monthly rent for the schedule premises shall be Rs. 32,000/- (Rupees Thirty Two Thousand only) per month, payable in advance on or before the 5th day of each English calendar month through bank transfer.

3. SECURITY DEPOSIT: The Lessee has deposited an interest-free refundable security deposit of Rs. 1,60,000/- (Rupees One Lakh Sixty Thousand only) with the Lessor, receipt of which is hereby acknowledged. The said deposit shall be refunded upon peaceful handover of vacant possession.

4. DELAYED PAYMENT & PENALTIES: In the event of delay in rent payment beyond the 5th of any month, a penal interest of 18% per annum calculated on daily basis shall be levied. Continued default of 15 days shall entitle the Lessor to terminate this lease immediately.`,
  },
  {
    pageNumber: 2,
    fileName: "bengaluru_rental_page_2.png",
    text: `RENTAL AGREEMENT — PAGE 2 OF 2
Schedule Premises: Flat 302, Greenview Residency, Indiranagar, Bengaluru

5. MAINTENANCE & UTILITIES: The Lessee shall pay monthly society maintenance charges of Rs. 3,500/- (Rupees Three Thousand Five Hundred only) directly to the Greenview Apartment Owners Association on or before 10th of every month, along with electricity and water charges as per meter readings.

6. NOTICE PERIOD & TERMINATION: After the completion of the 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice or rent in lieu thereof.

7. PAINTING & DEDUCTIONS: Upon vacating the premises, one month's rent amounting to Rs. 32,000/- shall be deducted from the security deposit towards professional repainting and deep cleaning charges, irrespective of the physical condition of the walls.

8. INSPECTION & ACCESS: The Lessor or authorized representatives reserve the right to enter and inspect the premises at reasonable hours with 24 hours prior written notice to the Lessee.

9. REPAIRS: Minor routine repairs up to Rs. 1,000/- shall be borne by the Lessee. Major structural repairs shall be attended to by the Lessor.

10. JURISDICTION: This agreement is governed by the laws of India and only courts situated in Bengaluru shall have competent jurisdiction.

IN WITNESS WHEREOF the parties have set their hands on the day, month, and year first written above.

LESSOR: _______________________ (R. Venkatesh Rao)
LESSEE: _______________________ (Alok Sharma)

WITNESS 1: _____________________
WITNESS 2: _____________________`,
  },
];

export const SAMPLE_TERMS: TermItem[] = [
  {
    key: "rent",
    label: "Monthly Rent",
    value: "₹32,000",
    quote:
      "The monthly rent for the schedule premises shall be Rs. 32,000/- (Rupees Thirty Two Thousand only) per month, payable in advance on or before the 5th day of each English calendar month through bank transfer.",
    page: 1,
    verified: true,
  },
  {
    key: "deposit",
    label: "Security Deposit",
    value: "₹1,60,000",
    quote:
      "The Lessee has deposited an interest-free refundable security deposit of Rs. 1,60,000/- (Rupees One Lakh Sixty Thousand only) with the Lessor, receipt of which is hereby acknowledged.",
    page: 1,
    verified: true,
  },
  {
    key: "lock_in",
    label: "Lock-in Period",
    value: "6 months",
    quote:
      "The initial 6 (six) months shall be considered as an irrevocable lock-in period during which neither party can terminate the agreement without paying the full rent for the remaining lock-in period.",
    page: 1,
    verified: true,
  },
  {
    key: "notice_period",
    label: "Notice Period",
    value: "2 months",
    quote:
      "After the completion of the 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice or rent in lieu thereof.",
    page: 2,
    verified: true,
  },
  {
    key: "penalties",
    label: "Late Payment Penalties",
    value: "18% p.a. daily interest",
    quote:
      "In the event of delay in rent payment beyond the 5th of any month, a penal interest of 18% per annum calculated on daily basis shall be levied.",
    page: 1,
    verified: true,
  },
  {
    key: "maintenance",
    label: "Society Maintenance",
    value: "₹3,500/month",
    quote:
      "The Lessee shall pay monthly society maintenance charges of Rs. 3,500/- (Rupees Three Thousand Five Hundred only) directly to the Greenview Apartment Owners Association on or before 10th of every month, along with electricity and water charges as per meter readings.",
    page: 2,
    verified: true,
  },
];

export const SAMPLE_FLAGS: FlagItem[] = [
  {
    title: "Mandatory 1-month painting deduction regardless of wall condition",
    reason:
      "Clause 7 mandates an automatic full one-month deduction for repainting irrespective of wear and tear, alongside Clause 3's commitment to refund upon peaceful handover.",
    quotes: [
      "Clause 3: The said deposit shall be refunded upon peaceful handover of vacant possession.",
      "Clause 7: Upon vacating the premises, one month's rent amounting to Rs. 32,000/- shall be deducted from the security deposit towards professional repainting and deep cleaning charges, irrespective of the physical condition of the walls.",
    ],
    question:
      "Could we clarify if the painting deduction can be based on actual inspection invoices and prorated if the stay is short, rather than an automatic one-month deduction?",
  },
  {
    title: "Immediate lease termination on 15-day delay vs lock-in liability",
    reason:
      "Clause 4 allows the landlord to cancel the agreement after 15 days delay, while Clause 1 binds the tenant to pay full rent for the remaining 6-month lock-in.",
    quotes: [
      "Clause 1: The initial 6 (six) months shall be considered as an irrevocable lock-in period during which neither party can terminate the agreement without paying the full rent for the remaining lock-in period.",
      "Clause 4: In the event of delay in rent payment beyond the 5th of any month, a penal interest of 18% per annum calculated on daily basis shall be levied. Continued default of 15 days shall entitle the Lessor to terminate this lease immediately.",
    ],
    question:
      "Could we clarify the grace period before lease termination, and confirm whether the lock-in penalty applies if the landlord terminates the lease early?",
  },
  {
    title: "Notice period duration vs deposit refund turnaround",
    reason:
      "Clause 6 requires a 2-month notice window from the tenant, but Clause 3 leaves the exact refund timeline for the deposit unspecified after key handover.",
    quotes: [
      "Clause 6: After the completion of the 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice or rent in lieu thereof.",
      "Clause 3: The said deposit shall be refunded upon peaceful handover of vacant possession.",
    ],
    question:
      "Could we agree on a specific turnaround window (such as within 7 bank working days) for the security deposit refund following key handover?",
  },
];

export const PRESET_BREAK_IT_QUESTIONS = [
  {
    label: "Landlord unannounced entry",
    question: "Can the landlord enter my apartment without prior notice?",
    expectedStatus: "answered" as const,
  },
  {
    label: "Pet ownership policy",
    question: "Are pets allowed in the apartment?",
    expectedStatus: "not_found" as const,
  },
  {
    label: "Delayed rent penalty",
    question: "What happens if rent is delayed past the 5th of the month?",
    expectedStatus: "answered" as const,
  },
  {
    label: "Subletting permissions",
    question: "Can I sublet one bedroom on Airbnb or to a friend?",
    expectedStatus: "not_found" as const,
  },
  {
    label: "Move-out painting deduction",
    question: "How much will be deducted for painting when I vacate?",
    expectedStatus: "answered" as const,
  },
  {
    label: "Annual rent escalation cap",
    question: "Is there a ceiling percentage for rent increase upon renewal?",
    expectedStatus: "not_found" as const,
  },
];
