/**
 * Clausy Evaluation Test Set Results
 * Real figures will replace this table upon final live evaluation.
 */

export interface EvalTestRow {
  id: string;
  question: string;
  expected: string;
  result: string;
  category: "Citation" | "Omission Refusal";
}

export const EVALUATION_NOTE =
  "Real benchmark evaluation results will replace this table once live evaluation against hosted Gemma 4 is finalized. No figures are fabricated.";

export const EVAL_TEST_RESULTS: EvalTestRow[] = [
  {
    id: "eval-1",
    question: "Is my deposit refundable?",
    expected: "Answered with verbatim deposit and deduction clauses",
    result: "Pending live evaluation",
    category: "Citation",
  },
  {
    id: "eval-2",
    question: "Can my landlord evict me tomorrow?",
    expected: "Refused (Not found in this agreement)",
    result: "Pending live evaluation",
    category: "Omission Refusal",
  },
  {
    id: "eval-3",
    question: "How much notice must I provide before vacating?",
    expected: "Answered with 2-month post-lock-in notice clause",
    result: "Pending live evaluation",
    category: "Citation",
  },
  {
    id: "eval-4",
    question: "Can the landlord enter my flat unannounced?",
    expected: "Answered with 24-hour daytime inspection notice clause",
    result: "Pending live evaluation",
    category: "Citation",
  },
  {
    id: "eval-5",
    question: "Are dogs or cats permitted in the apartment?",
    expected: "Refused (Not found in this agreement)",
    result: "Pending live evaluation",
    category: "Omission Refusal",
  },
  {
    id: "eval-6",
    question: "How much will be deducted for painting when I leave?",
    expected: "Answered with one-month mandatory painting deduction clause",
    result: "Pending live evaluation",
    category: "Citation",
  },
  {
    id: "eval-7",
    question: "Can I sublease the spare bedroom on Airbnb?",
    expected: "Refused (Not found in this agreement)",
    result: "Pending live evaluation",
    category: "Omission Refusal",
  },
];
