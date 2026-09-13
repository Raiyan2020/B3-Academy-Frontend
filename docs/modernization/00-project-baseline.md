# 00 — Project Baseline

Recorded **2026-09-08**, before any modernization change. Everything here is the
**pre-existing** state of the repository, measured rather than assumed. Its purpose
is to stop pre-existing problems being misattributed to modernization work.

## Toolchain

| Item | Value |
| --- | --- |
| Node | v22.14.0 |
| npm | 11.3.0 (also installed: pnpm 10.10.0, bun 1.2.10) |
| Package manager in use | **npm** — `package-lock.json` is the only lockfile |
| Language | TypeScript 5.8 (`~5.8.2`) |
| Git branch | `main`, clean working tree at start |

## Framework versions (from `package.json`)

| Package | Version |
| --- | --- |
| next | ^16.2.9 |
| react / react-dom | ^19.2.1 |
| typescript | ~5.8.2 |
| tailwindcss / @tailwindcss/postcss | ^4.3.1 |
| @tanstack/react-query | ^5.101.0 |
| react-hook-form | ^7.80.0 |
| @hookform/resolvers | ^5.4.0 |
| zod | ^4.4.3 |
| radix-ui (meta package) | ^1.6.2 |
| @radix-ui/react-{dialog,dropdown-menu,tabs,slot} | 1.1.17 / 2.1.18 / 1.1.15 / 1.3.0 |
| lucide-react | ^0.556.0 |
| motion | ^12.38.0 |
| sonner | ^2.0.7 |
| cmdk | ^1.1.1 |
| isomorphic-dompurify | ^3.18.0 |
| react-markdown | ^10.1.0 |
| jspdf | ^4.2.1 |
| @google/genai | ^1.50.1 |
| react-phone-number-input | ^3.4.16 |
| input-otp | ^1.4.2 |
| eslint / eslint-config-next | ^9.39.4 / ^16.2.9 |
| vitest | ^4.1.9 |
| @testing-library/react | ^16.3.2 |

This is already a **current** stack. No version upgrade is required as a
precondition for modernization, and none is planned.

## Architecture

- **Router:** App Router only. No Pages Router, no hybrid.
- **Route groups** under `src/app/`: `(site)`, `(account)`, `(admin)`, `(auth)`,
  `(checkout)`, `(community)`, `(doctor)`, `(learn)`, `(library)`.
- **Route handlers:** one — `src/app/api/ai/chat`.
- **Middleware:** `src/middleware.ts` present.
- **Features:** 27 directories under `src/features/` — `access`, `account`, `admin`,
  `ai-assistant`, `auth`, `books`, `business`, `care`, `checkout`, `clinic`,
  `community`, `consultations`, `courses`, `education`, `health-assessment`,
  `i18n`, `learning`, `library`, `navigation`, `newsletter`, `payments`,
  `podcasts`, `reviews`, `search`, `site-content`, `society`, `subscriptions`,
  `trips`.
- **Shared:** `src/components/{ui,layout,feedback,actions}`,
  `src/lib/{api,query,forms,motion,routing,storage,feedback}`.
- **File counts:** 104 files under `src/app`, 288 `.tsx`, 201 `.ts`.
- **Conventions are already documented** in `AGENTS.md` and `.cursor/*.md`
  (`architecture.md`, `components.md`, `react-query.md`, `server-first.md`,
  `i18n.md`, `framer-motion-stagger.md`) plus `.cursor/rules/*.mdc`.
  Modernization is measured against **these**, not a generic ideal.
- **State/data:** TanStack Query for server state; React Context for auth,
  language and currency; react-hook-form + zod for forms; sonner for toasts.
- **Backend:** a separate Laravel API (repo `Raiyan2020/B3-Academy-Backend`)
  vendored at `./backend/` as its **own git repository**, reached over HTTP at
  `NEXT_PUBLIC_API_BASE_URL`. It is not part of the Next.js build.
- **i18n:** bilingual Arabic/English via a root-level `LanguageContext.tsx`.
  `AGENTS.md` explicitly **defers** i18n and RTL work, so it is out of scope here.

## Configuration notes (pre-existing)

- `tsconfig.json` sets **`"strict": false`** — no `strictNullChecks`, no
  `noImplicitAny`. Also `allowJs`, `allowImportingTsExtensions`,
  `experimentalDecorators`, `useDefineForClassFields: false`, `skipLibCheck`, and an
  `include` rooted at the **repo root** (`**/*.ts`, `**/*.tsx`) so legacy files
  outside `src/` are type-checked too.
- `eslint.config.mjs` **disables** the following, with a comment attributing it to
  the migration baseline: `@typescript-eslint/no-explicit-any`,
  `@typescript-eslint/no-unused-vars`, `@next/next/no-img-element`,
  `react/no-unescaped-entities`, `react-hooks/rules-of-hooks`,
  `react-hooks/set-state-in-effect`, `react-hooks/purity`, `jsx-a11y/alt-text`.
  **Consequence: hook-rule violations, `any`, unoptimized images and missing
  `alt` text are currently unchecked by tooling.** Several audit findings below
  exist precisely because nothing was watching for them.
- `next.config.ts` configures only `images.remotePatterns` (picsum.photos,
  images.unsplash.com, raiyansoft.com, nader32.com). No bundle analysis, no
  redirects, no headers.
- `components.json` (shadcn): style `new-york`, baseColor `slate`,
  **`cssVariables: false`**, `rsc: true`.
- **No Prettier configuration** at all (no `.prettierrc`, no dependency).
  Formatting is unenforced.
- **No CI/CD** — no `.github/` directory. Nothing runs these checks automatically.
- Agent tooling present at baseline: `.cursor/mcp.json` (shadcn, next-devtools).
  No `.claude/` directory, no `.mcp.json`.

## Baseline verification results

Measured on a clean tree. `node_modules` was **absent** and installed with
`npm install` (exit 0) as the first step.

| Check | Command | Result |
| --- | --- | --- |
| Install | `npm install` | **PASS** — exit 0 |
| Typecheck | `npx tsc --noEmit` | **PASS** — exit 0, 0 errors |
| Tests | `npm test` (`vitest run`) | **PASS** — 20 files, 59 tests, 0 failures (~48s) |
| Lint (as configured) | `npm run lint` | **FAIL** — 18,380 problems (1,845 errors, 16,535 warnings) |
| Lint (frontend only) | `npx eslint src` | 3 problems (0 errors, 3 warnings) |
| Build | `npm run build` | **PASS** — exit 0 |

### The lint number needs explaining

`npm run lint` runs `eslint . --max-warnings=0` from the repo root, and
`eslint.config.mjs` ignores only `.next/**`, `node_modules/**` and
`migrated_prompt_history/**`. It therefore **walks into `./backend/`** and lints the
Laravel app's JavaScript — `backend/resources/js/**`, `backend/tests/js/**`,
`backend/webpack.mix.js`, plus bundled and minified assets.

Scoped to the actual frontend, the picture is completely different:

- `npx eslint src` → **3 problems, 0 errors**, all `react-hooks/exhaustive-deps`:
  - `src/features/consultations/components/booking-slot-selector.tsx:38` — `useMemo` missing dep `filters`
  - `src/features/consultations/components/booking-slot-selector.tsx:46` — `useMemo` missing dep `filters`
  - `src/features/consultations/components/chat-consultation.tsx:42` — `messages` logical expression destabilizes a `useEffect` dependency
- `npx eslint . --ignore-pattern 'backend/**'` → **also 3 problems**, so the
  repo-root legacy files contribute **zero** lint problems — though only because
  the relevant rules are switched off.

So **all 1,845 errors and effectively all 16,535 warnings come from `backend/`,
not from this application.** `npm run lint` is unusable as a gate in its present
form. This is a config bug, not code debt, and is a Batch 1 fix.

### Build output

`npm run build` succeeds. Routes resolve to a mix of `○ (Static)` prerendered and
`ƒ (Dynamic)` server-rendered on demand, and the middleware is reported by Next 16
as `ƒ Proxy (Middleware)` — worth noting for the middleware-convention question in
the Next.js audit.

## Known pre-existing defects

Carried forward as audit findings. All of these existed **before** any change made
in this effort.

1. `src/features/account/components/settings-page.tsx:19-22` — **Rules-of-Hooks
   violation.** An `if (!user) { navigate('/auth'); return null; }` early return sits
   ahead of 16+ `useState` calls (20 hook calls in the file), so the number of hooks
   executed varies with auth-hydration state. It also calls `navigate()` **during
   render**, a side effect in the render body. *Verified directly by reading the
   file.* Invisible to tooling because `react-hooks/rules-of-hooks` and
   `react-hooks/purity` are disabled.
2. `src/features/podcasts/components/podcast-player-provider.tsx:49-66` — the
   playback-restore effect ref-locks itself before `AuthProvider` hydrates `user`,
   silently discarding saved playback for signed-in users on cold load.
3. The auth bearer token lives in `localStorage` only
   (`src/lib/api/base-fetch.ts:65-68`), so `apiFetch` cannot attach credentials
   during SSR/RSC. This structurally blocks the server-prefetch +
   `HydrationBoundary` pattern `AGENTS.md` mandates for authenticated routes.
4. The server-first convention is largely unrealized: **1 of 94** `page.tsx` files
   implements server prefetch + hydration; roughly 90 are `'use client'`.
5. Two independent "current user" sources of truth — `AuthContext` local state and
   the `useBackendProfile()` query cache — never synchronized.
6. `settings-page.tsx` holds `addresses` as both effect-synced query state **and**
   independently mutated local state.
7. `src/features/checkout/components/checkout-page.tsx` — 814 lines, `item: any`,
   seven product types' business rules inlined, a 240-line `confirmPayment`.
8. Newsletter management silently falls back to a fake localStorage OTP flow with a
   hardcoded `'123456'` code when its backend query errors.
9. `FormFieldError` is defined but has **zero consumers**; ~28 files hand-roll
   red-text field errors with no `aria-invalid` / `aria-describedby`. The shared
   `Input`/`Label` primitives have no `aria-invalid` support, and `htmlFor` appears
   exactly once in the whole codebase.
10. Icon-only buttons are largely unlabeled — 16 `aria-label` and 2 `sr-only` in
    total across the 60 files importing `lucide-react`; the shadcn `size="icon"`
    convention is used zero times.
11. `next/image` is **never used**; all **26** raw `<img>` tags bypass the
    optimization domains already configured in `next.config.ts`. 4 of them put
    `alt=""` on informative thumbnails.
12. Dark mode is inert — 18 `dark:` classes exist with no `@theme`, no
    `ThemeProvider` and no toggle.
13. Nine files hand-build `fixed inset-0` modals instead of the shared, unused
    `ui/dialog.tsx`.
14. `AdminShell` and `AdminPageHeader` both default to rendering `<h1>{title}</h1>`,
    risking duplicate `h1`s on admin pages.
15. `lang="ar" dir="rtl"` is hardcoded in the root layout and never follows
    `LanguageContext`. **Deferred by project decision** (`AGENTS.md`) — recorded, not
    scheduled.
16. `LanguageContext.tsx` (72.4 KB) plus five other root context files ship globally
    to every route via `src/app/providers.tsx`.
17. `motion/react` is eagerly imported in 7 files, including the globally mounted
    `AIChatWidget`.
18. `npm run lint` fails repo-wide for the config reason above.
19. No Prettier and no CI — nothing enforces any of this automatically.

### Root-level legacy files — live vs dead

Determined by grepping actual importers. This distinction matters for dead-code
removal and must not be guessed at.

**Still live — do NOT delete:** `LanguageContext.tsx` (94 importers, mounted in
`providers.tsx`), `CurrencyContext.tsx` (12 importers), `types.ts`, `data.ts`,
`components/UI.tsx`, `components/Graphics.tsx`.

**Mounted in `providers.tsx` but zero consumers:** `BlogContext.tsx`,
`ResearchContext.tsx`, `TheoryContext.tsx`, `CourseCommentContext.tsx`.

**Zero imports anywhere:** `components/Layout.tsx`, `components/QuizPlayer.tsx`,
`components/HealthAssessmentForm.tsx`, `components/AIChatWidget.tsx`,
`services/geminiService.ts`.

## Backend state at baseline

`./backend/` was pulled from `0937817` to `dfd368c` at the start of this session —
226 files changed, +13,401 / −1,202. The API changes are **additive only**; the full
delta is in [backend-api-delta.md](backend-api-delta.md). An untracked `backend.zip`
sits in that repo's root; it predates this session and was left untouched.
