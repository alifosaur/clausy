/**
 * Clausy Frontend Configuration
 */

export const GEMMA_MODEL_NAME =
  process.env.NEXT_PUBLIC_GEMMA_MODEL_NAME || "Gemma 4";

export const PROVIDER_NAME =
  process.env.NEXT_PUBLIC_PROVIDER_NAME || "a hosted provider";

export const MODEL_PROVIDER_NAME = PROVIDER_NAME;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://clausy.example"
).replace(/\/$/, "");

export const GITHUB_REPO_URL = "https://github.com/alifosaur/clausy";
export const GITHUB_ISSUES_URL = "https://github.com/alifosaur/clausy/issues";

export const TEAM_NAME = "judgesnightmareee";
export const HACKATHON_TRACK = "Track 1: Best Use of Gemma 4";
export const PROBLEM_STATEMENT = "G3";

export const SARVAM_DATA_POLICY_NOTICE =
  "Audio and text you submit for translation or speech are processed by Sarvam AI. Clausy itself stores nothing.";

export const DATA_POLICY_NOTICE =
  `Audio and text you submit for translation or speech are processed by Sarvam AI. Clausy itself stores nothing. Document pages are processed by ${PROVIDER_NAME} hosting Gemma 4.`;

