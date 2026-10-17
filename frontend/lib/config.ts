/**
 * Clausy Frontend Configuration
 */

export const GEMMA_MODEL_NAME =
  process.env.NEXT_PUBLIC_GEMMA_MODEL_NAME || "Gemma 4";

export const MODEL_PROVIDER_NAME =
  process.env.NEXT_PUBLIC_MODEL_PROVIDER_NAME || "Google (Gemini API)";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://clausy.example"
).replace(/\/$/, "");

export const GITHUB_REPO_URL = "https://github.com/alifosaur/clausy";
export const GITHUB_ISSUES_URL = "https://github.com/alifosaur/clausy/issues";

export const TEAM_NAME = "judgesnightmareee";
export const HACKATHON_TRACK = "Track 1: Best Use of Gemma 4";
export const PROBLEM_STATEMENT = "G3";

export const DATA_POLICY_NOTICE =
  "Clausy itself stores nothing. Pages are processed by Google's hosted Gemini API running Gemma 4; check Google's data policy before uploading private documents.";
