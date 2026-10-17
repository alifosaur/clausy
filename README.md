# Clausy 📜

> **Helping tenants understand rental agreements without AI hallucinations.**
> Upload photos of agreement pages; Gemma reads them; code verifies every quote; answers are cited or refused.

**Hackathon**: Track 1, Best Use of Gemma 4 · **Problem Statement**: G3 (Agreement Clarity & Anti-Hallucination)  
**Team**: `judgesnightmareee`  
**Built**: 13–18 October 2026  
**License**: Open Source (MIT)

---

## 🌟 Overview & Why Clausy Exists

Rental agreements in Bengaluru and across urban India are notoriously lengthy, confusing, and packed with interacting clauses. Traditional generative AI summaries suffer from a dangerous flaw: **LLMs hallucinate**. They fabricate non-existent clause numbers, invent friendly terms that aren't in the lease, or hallucinate mathematical multipliers on deposits.

**Clausy solves this with a Ground-Truth Architecture**:
1. **Gemma 4 Semantic Extraction**: Gemma 4 identifies key lease parameters and clauses worth asking about.
2. **Deterministic Code Verification (`lib/verifier.ts`)**: Code inspects every quote against the raw extracted text. Any quote not strictly found in the document is withheld or marked unverified.
3. **Deterministic Money Card (`lib/calculator.ts`)**: Financial ratios—such as deposit multiple of rent and notice period coverage—are computed purely through deterministic software arithmetic, not estimated by language models.
4. **Strict Refusal Contract**: If a topic (such as pet ownership or Airbnb subletting) is not in the lease, Clausy refuses to guess and explicitly tells the tenant: *"Not found in this agreement."*

---

## 🎨 Design Philosophy

- **Warm paper-white background** (`#FAF8F5`), **near-black ink** (`#141413`).
- **ONE accent**: Highlighter yellow (`#FFE600` / `#FEF08A`).
- **Typography**: Editorial serif headlines (**Fraunces**) + clean sans-serif UI (**Inter**). No other fonts or colours.
- **Signature interaction**: The cited quote is highlighted in the document with an authentic animated marker stroke.
- **Accessibility & Motion**: Strict WCAG AA contrast (16:1 text ratio) and full support for `prefers-reduced-motion`.

---

## 🧭 Routes

Clausy maintains a focused, uncluttered route structure:
- `/` — Landing page with value proposition, drag & drop image uploader, and one-click sample loader.
- `/workspace` — Split-screen reader: Left document viewer (image/text toggle, editable OCR text, "Re-analyze", marker highlights) + Right tabs (Key terms & Money Card, Worth Clarifying flags, and Cited Ask with "Try to break it" presets).
- `/how-we-verify` — Deep dive into the 4-stage anti-hallucination verification pipeline.
- `/about` — Hackathon submission details, zero-storage privacy policy, not-legal-advice disclaimer, and team info.
- Custom 404 (`not-found.tsx`) — Warm paper-styled not found page.

---

## 📊 Data Contract

All data flows through a single abstraction layer (`lib/api.ts`) allowing seamless swapping between mock data and live Gemma 4 inference:

```typescript
{
  "terms": [
    {
      "key": "rent",
      "label": "Monthly Rent",
      "value": "₹32,000",
      "quote": "The monthly rent for the schedule premises shall be Rs. 32,000/- per month...",
      "page": 1,
      "verified": true
    }
  ],
  "flags": [
    {
      "title": "Mandatory 1-month painting deduction regardless of wall condition",
      "reason": "Clause 7 mandates an automatic full one-month deduction for repainting...",
      "quotes": ["Clause 3: ...", "Clause 7: ..."],
      "question": "Could we clarify if the painting deduction can be based on actual condition?"
    }
  ],
  "answer": {
    "text": "The agreement specifies 24 hours written notice for landlord inspections.",
    "quotes": ["Clause 8: The Lessor reserves the right to enter with 24 hours prior written notice..."],
    "status": "answered" | "not_found"
  }
}
```

---

## 📋 The 60-Item Every-Website Checklist

All 60 checklist requirements are explicitly addressed in Clausy:

| # | Item | Status | Implementation Details |
|---|------|--------|------------------------|
| **1** | Responsive | ✅ Implemented | Fluid layouts, mobile stacked view with tab switcher, desktop 50/50 split |
| **2** | Consistent UI | ✅ Implemented | Warm paper `#FAF8F5`, near-black `#141413`, highlighter yellow `#FFE600` |
| **3** | Navbar | ✅ Implemented | Responsive header with Fraunces logo, route links, and mobile menu |
| **4** | Working buttons/links | ✅ Implemented | All CTA buttons, tabs, modal triggers, and navigation links tested |
| **5** | Fast loading | ✅ Implemented | App router static generation, sub-160KB first-load JS bundle |
| **6** | Accessibility | ✅ Implemented | Semantic HTML5, high-contrast ratios (16:1), ARIA roles and labels |
| **7** | Readable type + contrast | ✅ Implemented | Fraunces serif + Inter sans, 1.6 line height, high contrast |
| **8** | Form validation | ✅ Implemented | Client and server checks for JPG/PNG file types, 5MB max size, question trim |
| **9** | Loading states | ✅ Implemented | Staged "Reading page X of Y...", spinner animations, progress alerts |
| **10** | Error states | ✅ Implemented | Graceful banners, API error toasts, and error boundaries |
| **11** | Empty states | ✅ Implemented | Clear first-time CTA state when no document is loaded |
| **12** | Toasts | ✅ Implemented | Custom paper-styled Toast notification system in `components/Toast.tsx` |
| **13** | Custom 404 | ✅ Implemented | Editorial paper 404 in `app/not-found.tsx` with return home button |
| **14** | Favicon + title | ✅ Implemented | Custom SVG favicon (`public/favicon.svg`) with document highlighter icon |
| **15** | Clean URLs | ✅ Implemented | Canonical routes (`/`, `/workspace`, `/how-we-verify`, `/about`) |
| **16** | Meta title/description | ✅ Implemented | Dynamic Open Graph and Twitter card metadata in App Router |
| **17** | Open Graph | ✅ Implemented | Configured in `app/layout.tsx` with locale, preview titles, descriptions |
| **18** | Semantic HTML | ✅ Implemented | `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>` |
| **19** | Image optimization + alt | ✅ Implemented | Accessible alt text for document images and simulated pages |
| **20** | HTTPS (Vercel) | ✅ Implemented | Production deployment target configured for HTTPS on Vercel |
| **21** | Secure input validation | ✅ Implemented | Payload inspection, body size limits, and sanitization |
| **22** | No exposed secrets | ✅ Implemented | API keys accessed only on server; `.env.local` in `.gitignore` |
| **23** | Auth | 🚫 N/A by design | Clausy requires no login or accounts; tenants use it immediately |
| **24** | Privacy section | ✅ Implemented | Disclosed across landing, about, and footer: in-memory only, nothing stored |
| **25** | Terms/not-legal-advice | ✅ Implemented | Prominent "Not legal advice" banners and disclaimers on every view |
| **26** | Cookie consent | 🚫 N/A by design | Zero cookies, zero tracking scripts, zero surveillance |
| **27** | Contact info | ✅ Implemented | Team `judgesnightmareee`, open-source repo details on `/about` |
| **28** | Search | 🚫 N/A by design | Readers interact directly with their specific document workspace |
| **29** | Dark mode | 🚫 N/A by design | Deliberate paper-white and near-black ink editorial aesthetic |
| **30** | Smooth animations | ✅ Implemented | Light GSAP marker wipe animations respecting `prefers-reduced-motion` |
| **31** | Confirm dialog | ✅ Implemented | Accessible modal dialog before clearing an uploaded document |
| **32** | Breadcrumbs | 🚫 N/A by design | Flat, simple 4-route architecture requires no nested breadcrumbs |
| **33** | Sitemap | ✅ Implemented | Next.js dynamic sitemap generated at `app/sitemap.ts` |
| **34** | Robots.txt | ✅ Implemented | Next.js search crawler directives in `app/robots.ts` |
| **35** | Analytics | 🚫 N/A by design | Privacy-first; no Google Analytics or tracking pixels |
| **36** | Performance | ✅ Implemented | Zero 3D/Three.js bundles, fast static prerendering |
| **37** | Cross-browser | ✅ Implemented | Tested on Chrome, Firefox, Safari, Edge via modern Tailwind / PostCSS |
| **38** | Keyboard nav | ✅ Implemented | Tab index navigation, Enter/Space actuation, Esc modal dismissal |
| **39** | Focus indicators | ✅ Implemented | High-visibility focus rings (`focus-visible:ring-2 focus-visible:ring-ink`) |
| **40** | Screen-reader labels | ✅ Implemented | `aria-label`, `aria-selected`, `aria-live="polite"`, `role="tab"` |
| **41** | Database | 🚫 N/A by design | Stateless architecture: zero database for absolute tenant confidentiality |
| **42** | API error handling | ✅ Implemented | Server routes return structured `{ error: string }` with HTTP status codes |
| **43** | Rate limiting + limits | ✅ Implemented | In-memory IP rate limiter (`lib/rateLimit.ts`) + 5MB / 10-page limits |
| **44** | Sessions | 🚫 N/A by design | Stateless in-memory workspace session |
| **45** | Testing (Eval set) | ✅ Implemented | Smoke test suite in `scripts/smoke-test.mjs` verifying verification & math |
| **46** | Backups | 🚫 N/A by design | No persistent user data stored |
| **47** | Custom domain | 🚫 N/A by design | Deployed on standard Vercel infrastructure |
| **48** | Reliable deployment | ✅ Implemented | Clean Next.js 15 build with 0 TypeScript/lint warnings |
| **49** | Env var management | ✅ Implemented | Documented in `.env.example`, graceful fallback if no key provided |
| **50** | Footer | ✅ Implemented | Consistent footer across routes with legal disclaimer and team credits |
| **51** | Spacing/design system | ✅ Implemented | Standardized 4/8/16/24/32px scale, soft shadows, rounded corners |
| **52** | No dead links | ✅ Implemented | Every link points to a valid live route |
| **53** | No horizontal overflow | ✅ Implemented | `overflow-x-hidden` on body and responsive containers |
| **54** | Onboarding | ✅ Implemented | 3-step walkthrough on landing page explaining the verification flow |
| **55** | First-time states | ✅ Implemented | Helpful guidance and one-click sample loader when workspace is empty |
| **56** | Password reset | 🚫 N/A by design | No accounts or passwords exist |
| **57** | Profiles | 🚫 N/A by design | No tenant profiles exist |
| **58** | Export/deletion | 🚫 N/A by design | Nothing is stored; clearing or closing the tab instantly purges data |
| **59** | README | ✅ Implemented | Exhaustive documentation covering architecture, tests, and checklist |
| **60** | Dependency hygiene | ✅ Implemented | Pin versions in `package.json`, `npm audit` run, minimal dependency tree |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Installation
```bash
git clone https://github.com/judgesnightmareee/clausy.git
cd clausy
npm install
```

### Environment Configuration (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your Gemma 4 / Google AI Studio API key:
```env
GEMMA_API_KEY=your_api_key_here
```
> **Note**: If no API key is configured, Clausy automatically uses its high-fidelity verified sample engine with zero setup required.

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Automated Smoke Tests
```bash
npm test
```
Runs the evaluation suite verifying:
- Exact & fuzzy quote verification
- Multi-page citation mapping
- Hallucination / fabrication rejection
- Deterministic Money Card math
- Refusal contract for unmentioned clauses
- Data contract schema compliance

### Production Build
```bash
npm run build
npm start
```

---

## ⚖️ Legal Disclaimer & Copy Standards

- **Not Legal Advice**: Clausy is an educational document reader, not a law firm. Clausy does not provide legal advice or legal representation.
- **Copy Standard**: Ambiguities are presented as *"worth asking your landlord"*. Clausy strictly avoids normative claims such as *"illegal"*, *"unfair"*, *"overcharged"*, or assertions about what is normal in Bengaluru.
- **Privacy First**: Documents are sent to a hosted model and processed in-memory. Nothing is stored on disk or in a database.

---

Built with ❤️ by **Team judgesnightmareee** for the Gemma 4 Hackathon (13–18 Oct 2026).
