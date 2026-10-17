# CLAUSY: PROJECT RULES (read before every task)

Clausy helps tenants understand rental agreements. Upload photos of agreement
pages; Gemma 4 reads them; code verifies every quote; answers are cited or
refused. Hackathon: Track 1, Best Use of Gemma 4, problem statement G3.
Team: judgesnightmareee. Built 13-18 Oct 2026. Public repo, open license.

## STACK
Next.js (App Router) + TypeScript + Tailwind + light GSAP. Deploy on Vercel.
No Three.js, no 3D. Gemma 4 is called only from server routes. Keys in env vars.

## DESIGN
- Warm paper-white bg, near-black ink, ONE accent: highlighter yellow.
- Serif headlines (Fraunces), sans UI (Inter). Do not add other fonts/colours.
- Calm, editorial, generous whitespace, rounded corners, soft shadows.
- Signature: the cited quote is highlighted in the document like a marker stroke.
- Respect prefers-reduced-motion.

## ROUTES (only these)
/  /workspace  /how-we-verify  /about  + custom 404
No login, accounts, dashboard, history, settings, payments. Do not add any.

## USER FLOW
Landing -> sample or upload -> "Reading page X of Y..." -> Workspace with results
-> Key terms / Worth clarifying / Ask -> "Try to break it" -> done.
Every screen has ONE obvious next action.

## WORKSPACE
Left: Document (Page image | Extracted text toggle; text is editable with a
"Re-analyze" button; cited quote highlighted here).
Right tabs:
1. Key terms: rent, deposit, lock-in, notice period, penalties, maintenance;
   each with value, quote, page. Money card: deposit as multiple of rent and
   notice duration, computed in CODE, not by the AI.
2. Worth clarifying: 2-4 flags, each with both source clauses side by side and
   a "Question to ask your landlord". Note: "Not legal advice."
3. Ask: text question, cited answers, "Not found in this agreement" refusal,
   and a "Try to break it" row of preset questions (some unanswerable).
Mobile: panels stack with a tab switch.

## FEATURES (build only these)
Must: sample agreement button; multi-page image upload (JPG/PNG); Gemma
extraction to the JSON contract; quote verification in code; editable text;
key terms + money card; cited Q&A with refusal; flags + landlord questions;
Try to break it; all UI states.
Only if everything works, in order: marker animation polish, voice question
(native Gemma audio only if the chosen model supports it, else skip),
Hindi/Kannada toggle, PDF upload.
Banned: anything not listed.

## COPY RULES
Say "worth asking your landlord". Never "illegal", "unfair", "overcharged", or
claims about what is normal in Bengaluru. Always disclose that documents are
sent to a hosted model and nothing is stored.

## DATA CONTRACT
{ "terms": [{ "key","label","value","quote","page","verified": boolean }],
  "flags": [{ "title","reason","quotes": [string], "question": string }],
  "answer": { "text","quotes": [string],"status":"answered|not_found" } }
All data goes through one data layer (lib/api.ts) so mock and real are swappable.
A quote not found in the extracted text is withheld or marked unverified.

## EVERY-WEBSITE CHECKLIST (all 60 must be addressed)
Build: 1 responsive; 2 consistent UI; 3 navbar; 4 working buttons/links;
5 fast loading; 6 accessibility; 7 readable type + contrast; 8 form validation;
9 loading; 10 error; 11 empty; 12 toasts; 13 custom 404; 14 favicon + title;
15 clean URLs; 16 meta title/description; 17 Open Graph; 18 semantic HTML;
19 image optimization + alt; 20 HTTPS (Vercel); 21 secure input validation;
22 no exposed secrets; 24 privacy section; 25 terms/not-legal-advice section;
27 contact info; 30 smooth animations; 31 confirm dialog before clearing an
upload; 33 sitemap; 34 robots.txt; 36 performance; 37 cross-browser;
38 keyboard nav; 39 focus indicators; 40 screen-reader labels; 42 API error
handling; 43 rate limiting + file size/type limits; 45 testing (eval set +
smoke test); 48 reliable deployment; 49 env var management; 50 footer;
51 spacing/design system; 52 no dead links; 53 no horizontal overflow;
54 onboarding; 55 first-time states; 59 README; 60 dependency hygiene
(npm audit once, pin versions).
Not applicable by design (document in README, no fake screens): 23 auth,
26 cookie consent (no cookies/tracking), 28 search, 29 dark mode,
32 breadcrumbs, 35 analytics, 41 database, 44 sessions, 46 backups,
47 custom domain, 56 password reset, 57 profiles, 58 export/deletion.

## WORKING RULES
- Small steps. After each task: run build, fix errors, summarise changes.
- Never invent features or pages. If unsure, ask.
- One component per feature. Remove anything unrequested.
- Never commit secrets. Use .env.local and .env.example.
