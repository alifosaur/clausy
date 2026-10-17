import { TermItem, FlagItem, DocumentPage, AnswerItem } from "../types";

export interface SamplePage extends DocumentPage {
  title: string;
}

export const SAMPLE_PAGES: SamplePage[] = [
  {
    pageNumber: 1,
    title: "Page 1: Parties, Property, Term & Financials",
    fileName: "kaveri_meadows_agreement_page_1.png",
    text: `RENTAL AGREEMENT — PAGE 1 OF 3
(Government of Karnataka E-Stamp Certificate No: IN-KA77391048291M / Stamp Duty: ₹100/-)

This RENTAL AGREEMENT is executed on this 1st day of November 2026 at Bengaluru, Karnataka:

BETWEEN:
Mr. Anand K. Murthy, aged about 52 years, residing at No. 14, 3rd Main, HSR Layout Sector 1, Bengaluru - 560102, hereinafter referred to as the "LESSOR" (which expression shall mean and include his legal heirs, executors, and assigns) of the ONE PART;

AND:
Ms. Priya Nair, aged about 27 years, residing at Bengaluru, hereinafter referred to as the "LESSEE" (which expression shall mean and include her legal heirs and representatives) of the OTHER PART.

WHEREAS the Lessor is the absolute lawful owner of residential property bearing Flat No. 204, 2nd Floor, B-Block, Kaveri Meadows, 17th Cross Road, HSR Layout Sector 4, Bengaluru - 560102, comprising 2 Bedrooms, Hall, Kitchen, Balcony, and one covered two-wheeler parking slot (hereinafter referred to as the "SCHEDULE PREMISES").

NOW THIS AGREEMENT WITNESSETH AND THE PARTIES AGREE AS FOLLOWS:

1. TERM & LOCK-IN PERIOD: The tenancy shall be for a fixed tenure of 11 (eleven) months commencing from 1st November 2026. The initial 6 (six) months shall be considered as an irrevocable lock-in period. If the Lessee vacates the premises prior to the completion of the lock-in period, the security deposit shall be subject to complete forfeiture and rent for the unexpired lock-in months shall remain payable.

2. MONTHLY RENT: The monthly rent for the schedule premises shall be Rs. 18,000/- (Rupees Eighteen Thousand only) per month, payable in advance on or before the 5th day of each English calendar month through NEFT/UPI bank transfer.

3. SECURITY DEPOSIT: The Lessee has deposited an interest-free refundable security deposit of Rs. 90,000/- (Rupees Ninety Thousand only) with the Lessor, receipt of which is hereby acknowledged. The said deposit shall be refunded upon peaceful handover of vacant possession of the premises after adjusting any applicable dues.`,
  },
  {
    pageNumber: 2,
    title: "Page 2: Maintenance, Notice Period & Deductions",
    fileName: "kaveri_meadows_agreement_page_2.png",
    text: `RENTAL AGREEMENT — PAGE 2 OF 3
Schedule Premises: Flat 204, B-Block, Kaveri Meadows, HSR Layout, Bengaluru

4. DELAYED PAYMENT & PENALTIES: In the event of delay in payment of the monthly rent beyond the 5th day of any calendar month, a penal interest of 18% per annum calculated on a daily basis shall be levied on the overdue amount. Delay continuing beyond 15 days shall entitle the Lessor to initiate termination proceedings immediately.

5. SOCIETY MAINTENANCE & UTILITIES: The Lessee shall pay monthly society maintenance charges of Rs. 2,200/- (Rupees Two Thousand Two Hundred only) directly to the Kaveri Meadows Apartment Owners Welfare Association on or before the 10th of every calendar month. Electricity and water consumption charges shall be paid directly by the Lessee as per separate meter bills.

6. NOTICE PERIOD & TERMINATION: After the expiration of the initial 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice, or payment of rent in lieu thereof.

7. REPAINTING & VACATING DEDUCTIONS: Upon vacating the premises, a fixed deduction equivalent to one month's rent amounting to Rs. 18,000/- shall be deducted from the security deposit towards mandatory repainting and deep sanitization charges, irrespective of the physical condition of the walls or duration of occupancy.`,
  },
  {
    pageNumber: 3,
    title: "Page 3: Access, Repairs & Signatures",
    fileName: "kaveri_meadows_agreement_page_3.png",
    text: `RENTAL AGREEMENT — PAGE 3 OF 3
Schedule Premises: Flat 204, B-Block, Kaveri Meadows, HSR Layout, Bengaluru

8. INSPECTION & ACCESS: The Lessor or his authorized agents reserve the right to enter and inspect the condition of the schedule premises at reasonable hours during the daytime, after providing a prior notice of at least 24 hours to the Lessee.

9. REPAIRS & UPKEEP: The Lessee shall keep the interior of the premises in good tenable condition. Minor day-to-day repairs up to Rs. 1,000/- per occurrence shall be borne by the Lessee. Major structural defects or plumbing leaks originating outside the apartment shall be rectified by the Lessor.

10. JURISDICTION: This tenancy agreement shall be interpreted in accordance with the laws of India, and courts situated in Bengaluru, Karnataka shall have exclusive jurisdiction over any disputes arising hereunder.

IN WITNESS WHEREOF the Lessor and the Lessee have affixed their signatures on the date, month, and year first written above.

LESSOR: _______________________ (Anand K. Murthy)
LESSEE: _______________________ (Priya Nair)

WITNESS 1: _____________________ (Ramesh Babu, Bengaluru)
WITNESS 2: _____________________ (Deepa S., Bengaluru)`,
  },
];

export const SAMPLE_TERMS: TermItem[] = [
  {
    key: "rent",
    label: "Monthly Rent",
    value: "₹18,000",
    quote:
      "The monthly rent for the schedule premises shall be Rs. 18,000/- (Rupees Eighteen Thousand only) per month, payable in advance on or before the 5th day of each English calendar month through NEFT/UPI bank transfer.",
    page: 1,
    verified: true,
  },
  {
    key: "deposit",
    label: "Security Deposit",
    value: "₹90,000",
    quote:
      "The Lessee has deposited an interest-free refundable security deposit of Rs. 90,000/- (Rupees Ninety Thousand only) with the Lessor, receipt of which is hereby acknowledged.",
    page: 1,
    verified: true,
  },
  {
    key: "lock_in",
    label: "Lock-in Period",
    value: "6 months",
    quote:
      "The initial 6 (six) months shall be considered as an irrevocable lock-in period. If the Lessee vacates the premises prior to the completion of the lock-in period, the security deposit shall be subject to complete forfeiture and rent for the unexpired lock-in months shall remain payable.",
    page: 1,
    verified: true,
  },
  {
    key: "notice_period",
    label: "Notice Period",
    value: "2 months",
    quote:
      "After the expiration of the initial 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice, or payment of rent in lieu thereof.",
    page: 2,
    verified: true,
  },
  {
    key: "penalties",
    label: "Late Payment Penalties",
    value: "18% p.a. daily penal interest",
    quote:
      "In the event of delay in payment of the monthly rent beyond the 5th day of any calendar month, a penal interest of 18% per annum calculated on a daily basis shall be levied on the overdue amount.",
    page: 2,
    verified: true,
  },
  {
    key: "maintenance",
    label: "Society Maintenance",
    value: "₹2,200/month",
    quote:
      "The Lessee shall pay monthly society maintenance charges of Rs. 2,200/- (Rupees Two Thousand Two Hundred only) directly to the Kaveri Meadows Apartment Owners Welfare Association on or before the 10th of every calendar month.",
    page: 2,
    verified: true,
  },
];

export const SAMPLE_FLAGS: FlagItem[] = [
  {
    title: "Lock-in penalty vs notice period interaction",
    reason:
      "Clause 1 states early departure causes total deposit forfeiture plus remaining lock-in rent, while Clause 6 allows either party to terminate after lock-in with 2 months notice or rent in lieu.",
    quotes: [
      "The initial 6 (six) months shall be considered as an irrevocable lock-in period. If the Lessee vacates the premises prior to the completion of the lock-in period, the security deposit shall be subject to complete forfeiture and rent for the unexpired lock-in months shall remain payable.",
      "After the expiration of the initial 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice, or payment of rent in lieu thereof.",
    ],
    question:
      "Could we clarify whether the 2-month notice can be served in month 5 to conclude exactly when the 6-month lock-in finishes, or if notice can only be initiated after month 6?",
  },
  {
    title: "Unspecified security deposit refund turnaround timeline",
    reason:
      "Clause 3 specifies the deposit is refunded upon peaceful handover, but does not define a maximum number of bank working days for the transfer. Meanwhile Clause 7 mandates a fixed one-month painting deduction.",
    quotes: [
      "The said deposit shall be refunded upon peaceful handover of vacant possession of the premises after adjusting any applicable dues.",
      "Upon vacating the premises, a fixed deduction equivalent to one month's rent amounting to Rs. 18,000/- shall be deducted from the security deposit towards mandatory repainting and deep sanitization charges, irrespective of the physical condition of the walls or duration of occupancy.",
    ],
    question:
      "Could we specify a definite refund timeline in the agreement (such as within 7 bank working days following key handover), and clarify if painting deduction applies if occupancy is under 11 months?",
  },
];

export const PRESET_QUESTIONS = [
  {
    label: "Is my deposit refundable?",
    question: "Is my deposit refundable?",
    expectedStatus: "answered" as const,
  },
  {
    label: "Can my landlord evict me tomorrow?",
    question: "Can my landlord evict me tomorrow?",
    expectedStatus: "not_found" as const,
  },
  {
    label: "Notice period requirement",
    question: "How much notice must I provide before vacating?",
    expectedStatus: "answered" as const,
  },
  {
    label: "Landlord inspection rules",
    question: "Can the landlord enter my flat unannounced?",
    expectedStatus: "answered" as const,
  },
  {
    label: "Pet ownership rules",
    question: "Are dogs or cats permitted in the apartment?",
    expectedStatus: "not_found" as const,
  },
  {
    label: "Repainting deduction",
    question: "How much will be deducted for painting when I leave?",
    expectedStatus: "answered" as const,
  },
  {
    label: "Subletting permission",
    question: "Can I sublease the spare bedroom on Airbnb?",
    expectedStatus: "not_found" as const,
  },
];

export function getSampleAskResponse(question: string): AnswerItem {
  const q = question.toLowerCase().trim();

  if (q.includes("deposit") && (q.includes("refund") || q.includes("back") || q.includes("return"))) {
    return {
      text: "Yes, the security deposit of ₹90,000 is interest-free and refundable upon peaceful handover of vacant possession, subject to deduction of one month rent (₹18,000) for mandatory repainting and any unpaid dues.",
      quotes: [
        "The Lessee has deposited an interest-free refundable security deposit of Rs. 90,000/- (Rupees Ninety Thousand only) with the Lessor, receipt of which is hereby acknowledged. The said deposit shall be refunded upon peaceful handover of vacant possession of the premises after adjusting any applicable dues.",
        "Upon vacating the premises, a fixed deduction equivalent to one month's rent amounting to Rs. 18,000/- shall be deducted from the security deposit towards mandatory repainting and deep sanitization charges, irrespective of the physical condition of the walls or duration of occupancy.",
      ],
      status: "answered",
    };
  }

  if (q.includes("notice") || q.includes("terminat") || q.includes("vacat") && !q.includes("paint")) {
    return {
      text: "After completing the initial 6-month lock-in period, either party may terminate the agreement by serving 2 months prior written notice, or paying rent in lieu thereof.",
      quotes: [
        "After the expiration of the initial 6-month lock-in period, either party may terminate this agreement by serving a 2 (two) months prior written notice, or payment of rent in lieu thereof.",
      ],
      status: "answered",
    };
  }

  if (q.includes("paint") || q.includes("sanitiz") || q.includes("wall")) {
    return {
      text: "One month's rent (₹18,000) will be deducted from your deposit upon vacating for repainting and deep sanitization, irrespective of the physical condition of the walls or stay duration. It is worth asking your landlord if this can be prorated.",
      quotes: [
        "Upon vacating the premises, a fixed deduction equivalent to one month's rent amounting to Rs. 18,000/- shall be deducted from the security deposit towards mandatory repainting and deep sanitization charges, irrespective of the physical condition of the walls or duration of occupancy.",
      ],
      status: "answered",
    };
  }

  if (q.includes("enter") || q.includes("inspect") || q.includes("unannounced") || q.includes("access")) {
    return {
      text: "No, the landlord cannot enter unannounced. The agreement requires the landlord to provide at least 24 hours prior notice and inspect only at reasonable daytime hours.",
      quotes: [
        "The Lessor or his authorized agents reserve the right to enter and inspect the condition of the schedule premises at reasonable hours during the daytime, after providing a prior notice of at least 24 hours to the Lessee.",
      ],
      status: "answered",
    };
  }

  if (q.includes("maintenance") || q.includes("society") || q.includes("association")) {
    return {
      text: "The tenant pays monthly society maintenance of ₹2,200 directly to the Kaveri Meadows Apartment Owners Welfare Association on or before the 10th of every month.",
      quotes: [
        "The Lessee shall pay monthly society maintenance charges of Rs. 2,200/- (Rupees Two Thousand Two Hundred only) directly to the Kaveri Meadows Apartment Owners Welfare Association on or before the 10th of every calendar month.",
      ],
      status: "answered",
    };
  }

  if (q.includes("delay") || q.includes("penalty") || q.includes("late") || q.includes("penal")) {
    return {
      text: "Rent delayed past the 5th incurs 18% per annum penal interest calculated on a daily basis. Delays continuing past 15 days entitle the landlord to initiate termination.",
      quotes: [
        "In the event of delay in payment of the monthly rent beyond the 5th day of any calendar month, a penal interest of 18% per annum calculated on a daily basis shall be levied on the overdue amount.",
      ],
      status: "answered",
    };
  }

  // Refusal for unmentioned topics (e.g. "Can my landlord evict me tomorrow?", pets, subletting, guest limits)
  return {
    text: "Not found in this agreement. No clauses address this topic in the extracted document.",
    quotes: [],
    status: "not_found",
  };
}
