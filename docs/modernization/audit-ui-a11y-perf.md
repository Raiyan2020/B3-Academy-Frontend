# UI Architecture, Accessibility & Static Performance Audit

Audit date: 2026-09-08
Scope: `src/` (Next.js 16.2 App Router, React 19.2, Tailwind v4, shadcn/ui `new-york`)
Method: read-only static analysis (grep/glob over source, no code changes). ESLint `jsx-a11y/alt-text` and `@next/next/no-img-element` are disabled in `eslint.config.mjs`, so this audit is the only current check for those classes of issue.
Baseline docs read: `AGENTS.md`, `.cursor/components.md`, `components.json`. This audit does not propose replacing any working custom UI or a visual redesign — every recommendation preserves current visual identity.

---

## Summary by severity

- **P0:** 0
- **P1:** 6 (dead/unwired feedback conventions, unlabeled form fields, giant client-side context bundle, hardcoded `lang`/`dir`, custom modal re-implementations, icon-only buttons without accessible names)
- **P2:** 6 (dark mode inert, motion ignores reduced-motion, raw `<img>` instead of `next/image`, heading hierarchy risk, `aria-invalid` not wired, unused Radix/heavy deps)
- **P3:** 4 (dead root files, lucide import style already clean, `react-hook-form` underused, misc dependency hygiene)

---

## PART A — shadcn/ui + component architecture

### A1. Inventory of `src/components/ui/`

18 files: `button.tsx`, `command.tsx`, `dialog.tsx`, `image-upload.tsx`, `input-otp.tsx`, `input.tsx`, `label.tsx`, `password-input.tsx` (+ `.test.tsx`), `phone-input.tsx`, `popover.tsx`, `rich-text.tsx` (+ `.test.tsx`), `scroll-area.tsx`, `sonner.tsx`, `submit-button.tsx`, `textarea.tsx`, `verification-code-input.tsx` (+ `.test.tsx`).

- Stock/near-stock shadcn: `dialog.tsx`, `popover.tsx`, `scroll-area.tsx`, `command.tsx`, `input-otp.tsx`, `sonner.tsx`, `label.tsx` (all standard Radix-wrapped shadcn patterns, `cn()` utility, `cva` where applicable).
- Customized shadcn base: `button.tsx`, `input.tsx`, `textarea.tsx` — simplified (no `cva` variant system visible on `input.tsx`/`textarea.tsx`, plain `cn()` wrap).
- Bespoke/project-specific (not in shadcn registry): `image-upload.tsx`, `password-input.tsx`, `phone-input.tsx`, `verification-code-input.tsx`, `submit-button.tsx`, `rich-text.tsx`.
- **Notably absent**: no `card.tsx`, `select.tsx`, `table.tsx`, `badge.tsx`, `tabs.tsx`, `dropdown-menu.tsx` despite `@radix-ui/react-dropdown-menu` and `@radix-ui/react-tabs` being installed dependencies (see A4).

### A2. Duplicated primitives

Clean — no duplicate `Button`/`Input`/`Card` implementations found (`grep -rln 'export function Button\|export const Button' src` → only `src/components/ui/button.tsx`; same single-hit result for `Input`). No `Card`, `Select`, `Table`, `Badge`, or `Tabs` exports exist anywhere, so there is nothing to de-duplicate there — but see A2b for a real duplication: hand-rolled modals.

```
Issue:            Bespoke modal/overlay re-implemented in multiple places instead of composing the shared Radix Dialog primitive
Location:         src/components/feedback/confirm-dialog.tsx:1-70; src/components/layout/auth-required-dialog.tsx; src/features/account/components/settings-page.tsx; src/features/admin/components/admin-shell.tsx; src/features/auth/components/auth-page.tsx; src/features/books/components/book-reader.tsx; src/features/health-assessment/components/account-health-assessments.tsx; src/features/health-assessment/components/health-assessment-form.tsx
Severity:         P2
Why it matters:   9 files hand-build a `fixed inset-0` overlay + panel (focus handling, Escape key, overlay-click dismiss all reimplemented per file) instead of using `src/components/ui/dialog.tsx`, which already wraps Radix Dialog and gets these behaviors for free and consistently. `confirm-dialog.tsx` does it reasonably well (role="alertdialog", aria-modal, manual focus restore, Escape handler) but the other 8 are unaudited copies of the same pattern with no guarantee of the same rigor.
Current behavior: Each file owns its own overlay/focus/escape logic; `src/components/ui/dialog.tsx` (Radix-backed) is never imported by any feature file — grep for `<Dialog|DialogContent` outside the definition files themselves returns 0 hits.
Recommended solution: For any new modal, or the next time one of these 9 is touched, compose `@/components/ui/dialog.tsx` instead of a new `fixed inset-0` div. Visual output can stay pixel-identical (Dialog content is unstyled by default). Not a blocking rewrite — flag for the next time each file is touched.
Risk:             Low — purely an internal wiring change, Radix Dialog matches the existing bg/overlay convention already used in dialog.tsx.
Verification method: `grep -rln 'fixed inset-0' src` should shrink to just the definition file over time; manual keyboard test (Tab trap, Escape, click-outside) on each converted modal.
Status:           Open
```

### A3. `cssVariables: false` — theming & dark mode

`components.json` sets `cssVariables: false`; `src/app/globals.css` confirms this — it has **no** `@theme` block at all (Tailwind v4 CSS-first tokens), just `@import "tailwindcss"` plus a handful of raw hex values (`background: #f8fafc`, `color: #1e293b`) and `:root { color-scheme: light; }`. Components use literal Tailwind color utilities (`slate-*`, `emerald-*`, `red-*`) directly rather than semantic CSS-variable tokens.

```
Issue:            No dark mode support exists; `color-scheme: light` is hardcoded and no theme provider/toggle exists
Location:         src/app/globals.css:3-5 (`:root { color-scheme: light; }`); project-wide
Severity:         P2
Why it matters:   18 raw `dark:` Tailwind classes exist in src (e.g. inside input-otp.tsx's baked-in shadcn classes) but there is no `@theme`/dark token system, no ThemeProvider, and no toggle UI (`grep -rli 'theme' src --include=*.tsx --include=*.ts` returns 0 files besides node_modules). Those 18 `dark:` classes are dead — Tailwind v4's default dark variant is `prefers-color-scheme`, but `color-scheme: light` plus the total absence of dark-specific design tokens means even a user with OS dark mode gets an unstyled/half-styled result if those classes ever fire.
Current behavior: Single light theme only; dark: classes are vestigial (came in with input-otp.tsx's stock shadcn scaffold, never extended or wired to a toggle).
Recommended solution: Not a new feature to build blind — flag as a decision point: either (a) strip the unused `dark:` classes from input-otp.tsx to stop implying dark-mode support that doesn't exist, or (b) if dark mode is wanted later, introduce it via a `@theme` block + a small ThemeProvider (a real, scoped feature, not part of this audit's remit to design).
Risk:             None for removing dead classes; a full dark-mode build is a separate, larger effort.
Verification method: `grep -rn 'dark:' src` after cleanup should return 0 (or intentional new usage tied to a working toggle).
Status:           Open
```

### A4. `radix-ui` meta-package vs individual `@radix-ui/react-*` packages

Both are installed. Actual import usage:
- Meta package `radix-ui`: `src/components/ui/dialog.tsx:5`, `popover.tsx:4`, `scroll-area.tsx:4`.
- Individual package: `src/components/ui/button.tsx:2` (`@radix-ui/react-slot`, `Slot`).

```
Issue:            @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, and @radix-ui/react-tabs are installed but never imported (dialog.tsx uses the radix-ui meta-package instead; dropdown-menu and tabs have zero usage anywhere)
Location:         package.json:11-14 (dependencies); confirmed via `grep -rn "from '@radix-ui/react-dialog'\|react-dropdown-menu\|react-tabs" src` → no matches; `grep -rln 'DropdownMenu' src` and `grep -rln '<Tabs\b\|TabsList\|TabsTrigger' src` → no matches
Severity:         P3
Why it matters:   Three unused direct dependencies. Not a runtime/bundle risk (unused code isn't imported so it isn't bundled), but it's dead weight in package.json/lockfile and a maintenance trap — a future `dropdown-menu.tsx`/`tabs.tsx` shadcn add would silently duplicate an already-installed-but-unused package.
Current behavior: `@radix-ui/react-slot` is the only individual `@radix-ui/react-*` package actually imported directly; everything else Radix-based goes through the `radix-ui` meta-package.
Recommended solution: Standardize on the `radix-ui` meta-package for all future primitives (already the dominant pattern here) and drop `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs` from package.json next time dependencies are touched, since nothing references them.
Risk:             Low — removing truly-unused deps; verify with a full grep before removal in case of dynamic/lazy imports.
Verification method: `grep -rn "@radix-ui/react-dialog\|react-dropdown-menu\|react-tabs" src` stays empty after removal; `npm run build` still succeeds.
Status:           Open
```

### A5. Feedback conventions vs. actual usage — the headline finding

AGENTS.md states: field errors → `FormFieldError`; API errors → `ErrorAlert`/`toastError`; mutation buttons → `SubmitButton`; dashboard images → `@/components/ui/image-upload`.

Measured usage counts (`grep -rl '<name>' src | wc -l`):

| Convention component | Files using it | Note |
|---|---|---|
| `FormFieldError` | **1** (its own definition file, `src/components/feedback/feedback.tsx:6`) | **Zero consumers anywhere in the codebase.** |
| `ErrorAlert` | 2 (`src/lib/feedback/toast.ts:20,36` — internal helper called by `toastError`, not a separate pattern) | Working as designed. |
| `toastError` | 14 | Working as designed, good adoption. |
| `SubmitButton` | 3 | Low adoption; most mutation buttons are hand-rolled. |
| raw `<input type="file" ...>` bypassing `image-upload.tsx` | 0 (only `image-upload.tsx:59` itself) | Convention followed. |

```
Issue:            FormFieldError — the documented convention for "field validation errors → under the exact input" — has zero real consumers; every field-level error in the app is instead a hand-rolled <p className="text-red-600 ..."> with no aria-invalid/aria-describedby wiring to its input
Location:         Convention defined at src/components/feedback/feedback.tsx:6-9. Representative violations: src/features/account/components/account-sections/password-page.tsx:57,60-61 (`{passwordIssue && <p className="mt-1 text-sm text-red-600">{passwordIssue}</p>}`, no id/aria-describedby on the field above it); 28 files total match `bg-red-50|text-red-600|border-red-` (`grep -rln 'bg-red-50\|text-red-600\|border-red-' src | wc -l` = 28), e.g. account-sections/{courses,favorites,newsletter,notifications,password,security}-page.tsx, settings-page.tsx, admin-role-gate.tsx.
Severity:         P1
Why it matters:   This is exactly the kind of fix AGENTS.md calls out as high-value: FormFieldError already renders `role="alert"` — fixing it once and wiring it into the ~28 places that currently roll their own red text fixes the pattern everywhere at once, and gives screen-reader users a live-region announcement they don't get today from a plain `<p>`.
Current behavior: Field errors render as plain text with no `id`, no `aria-invalid` on the associated `<input>`, and no `aria-describedby` linking the two. `src/components/ui/input.tsx` (the shared Input primitive) has no error-state prop at all — it's a thin `cn()` wrapper with no `aria-invalid`/error slot support, so consumers have no built-in way to opt in.
Recommended solution: Not a rewrite of 28 files today — the leverage move is: (1) confirm `FormFieldError` is fit for purpose (it already is: `role="alert"`, takes an `id`), (2) start using it (with a matching `id` + `aria-describedby` on the input) the next time each of these fields is touched, rather than the ad-hoc `<p className="text-red-600">`. No visual change required — same red text, same position, just swapped to the shared component plus two ARIA attributes.
Risk:             None — purely additive ARIA wiring, no visual change.
Verification method: `grep -rln "import.*feedback/feedback" src` should grow from 0; spot-check with a screen reader (NVDA/VoiceOver) that an error announces on submit.
Status:           Open
```

```
Issue:            The shared Input/Label primitives have no built-in aria-invalid/aria-describedby support, and htmlFor-based label association is almost never used
Location:         src/components/ui/input.tsx:1-16 (no aria-invalid prop, no error slot); src/components/ui/label.tsx:1-10 (plain wrapper, no forced htmlFor). `grep -rn 'htmlFor=' src | wc -l` = 1 across the entire codebase. `grep -rn 'aria-invalid\|aria-describedby' src` = 4 hits total, all inside src/components/ui/input-otp.tsx (stock shadcn classes) and src/components/ui/verification-code-input.tsx:39,49 (a good, self-contained example already in the codebase) plus confirm-dialog.tsx:57 — none in any feature form.
Severity:         P1
Why it matters:   With only 1 htmlFor in the whole app, the overwhelming majority of `<Label>`/`<input>` pairs are associated only by visual proximity, not programmatically — screen readers cannot reliably announce the field name when a text input receives focus.
Current behavior: `verification-code-input.tsx` already demonstrates the right pattern (`aria-invalid={invalid || undefined}` passed through to the underlying control) — it's just not extended to the plain `Input`/`Label` pair used everywhere else.
Recommended solution: When next touching a form field, add `id`/`htmlFor` pairing and, where the field can be invalid, `aria-invalid` + `aria-describedby` pointing at the paired `FormFieldError`'s `id` (same fix as A5 above, same rollout — do both together per field, not as a separate pass).
Risk:             None — additive attributes only, zero visual change.
Verification method: `grep -rn 'htmlFor=' src | wc -l` trending up as forms are touched; axe DevTools / Lighthouse a11y scan on a sample of account/checkout forms.
Status:           Open
```

`react-hook-form` + `zod` (the stated forms stack) is barely adopted: `useForm(`/`react-hook-form` import appears in exactly **1** file, `src/lib/forms/use-app-form.ts` (a thin `useAppForm` wrapper around `useForm` + `zodResolver`), consumed by only 2 feature files (`health-assessment-form.tsx`, `health-assessment-page.tsx`). `zod` schemas exist in 3 files total. Every other form in the app (password change, settings, auth, etc.) is plain controlled `useState`. This isn't a bug to fix in this audit (no visual/behavior change implied), but it explains why FormFieldError never got wired in — there's no `formState.errors` object driving it in most forms. Noted for context, not filed as a separate ticket.

---

## PART B — Accessibility

### B1 (task item 6). `<div onClick>` / `<span onClick>` as pseudo-buttons

Clean. `grep -rn '<div[^>]*onClick\|<span[^>]*onClick' src` → **0 matches**. No non-semantic click targets found via this pattern.

### B2 (task item 9). Icon-only buttons without accessible names

```
Issue:            Icon-only buttons are common but aria-label/sr-only coverage is very low, so most are unlabeled for screen readers
Location:         Representative: src/features/library/components/encyclopedia-list.tsx (icon-only action buttons alongside 15+ lucide icon imports in that feature); src/features/ai-assistant/components/ai-chat-widget.tsx:182-201 (`<motion.button>` open/close chat toggle — verify label); src/components/ui/image-upload.tsx (ImagePlus/X icon buttons); any button built from the 60 files that import lucide-react icons without a paired aria-label.
Severity:         P1
Why it matters:   aria-label total = 16 occurrences and sr-only = 2 occurrences project-wide (`grep -rn 'aria-label' src | wc -l` = 16; `grep -rn 'sr-only' src | wc -l` = 2), against 60 files importing lucide-react icons. Button variant `size="icon"` (the shadcn convention for icon-only buttons) has 0 usages, meaning icon-only buttons in this app don't even follow a single recognizable pattern to grep for — they're ad hoc, which is itself evidence they're not being systematically given accessible names.
Current behavior: Icon-only interactive elements generally rely on visual icon meaning alone with no aria-label/sr-only text and no title attribute.
Recommended solution: No visual change needed — add `aria-label="<action>"` (or a `sr-only` span) to icon-only buttons the next time each is touched, prioritizing global/persistent chrome (chat toggle, close/X buttons, image-upload remove button) since those are hit by every user session.
Risk:             None — invisible attribute addition only.
Verification method: axe/Lighthouse "Buttons must have an accessible name" rule; manual VoiceOver/NVDA pass over primary nav and chat widget.
Status:           Open
```

### B3 (task item 8). Images and `alt` text

Raw `<img>` count: **26** matches across 20 files (`grep -rn '<img' src | wc -l` = 26; test-file and encoded-HTML-string matches excluded from the count below leaves ~24 real render sites). Breakdown:
- **Meaningful `alt` present** (title/name bound): `image-upload.tsx:39` (`alt="{value}"` — actually empty, see below), `BookCard.tsx:19`, `BookDetailView.tsx:38`, `clinic-detail-page.tsx:67,112`, `clinic-page.tsx:89,123`, `booking-flow.tsx:98`, `CourseCard.tsx:13`, `CourseDetailView.tsx:59`, `podcast-player-provider.tsx:124`, `CommunityPostCard.tsx:24`, `CommunityPostDetailView.tsx:58`, `PlantFungiCard.tsx:19`, `PlantFungiDetailView.tsx:32`, `PodcastEpisodeCard.tsx:22`, `trip-detail-page.tsx:95`, `trips-page.tsx:185`.
- **Empty `alt=""` on informative content images** (decorative-only is the correct choice only if the image is purely presentational, which is not the case here — these are content thumbnails standing alone, not paired with visible adjacent text): `src/components/ui/image-upload.tsx:39` (`alt=""` — preview of a user-uploaded image, no name available at that point, arguably acceptable as decorative since it's adjacent to the "change image" control), `src/features/library/components/encyclopedia-detail.tsx:223` (`alt=""`), `src/features/library/components/encyclopedia-list.tsx:110,134,168` (`alt=""` — 3 more), `src/features/library/components/encyclopedia-detail.tsx:75` (has `alt={titleStr}`, this one is fine).

```
Issue:            26 raw <img> tags; a subset (4) carry alt="" on informative thumbnails instead of a real description
Location:         src/features/library/components/encyclopedia-list.tsx:110,134,168; src/features/library/components/encyclopedia-detail.tsx:223
Severity:         P2
Why it matters:   These are article/news/herb thumbnail images inside clickable cards with their own visible captions elsewhere in the DOM — alt="" hides them from screen reader users entirely, which is wrong when the image is the primary visual identifier for that list item (as opposed to genuinely decorative chrome).
Current behavior: alt="" (empty) on 4 informative images; the other ~20 raw <img> across the codebase already pass a real title/name into alt correctly (good, consistent pattern via `book.title`, `clinic.name`, `trip.name`, etc.) — so this is a small, fixable outlier, not a systemic issue.
Recommended solution: Pass the same title/name string already available in each map callback (`news.title`, `pick.title`, `herb.name`, `item.title`) into `alt` instead of `""`, matching the pattern already used correctly elsewhere in the same files (e.g. encyclopedia-detail.tsx:75 already does this right).
Risk:             None — text-only change, no visual impact (alt text isn't rendered).
Verification method: `grep -rn 'alt=""' src` shrinks; axe "Images must have alternate text" passes on /library routes.
Status:           Open
```

Separately — no `<img>` in this codebase is missing the `alt` attribute outright; the gap is specifically the 4 `alt=""` cases above. This is a materially better starting point than typical, so severity is capped at P2 rather than P1.

### B4 (task item 5, 15, 18). `next/image` is not used at all for content images

```
Issue:            next/image's <Image> component has zero real usage despite next.config.ts configuring remotePatterns for exactly this purpose
Location:         next.config.ts:4-9 (remotePatterns for picsum.photos, images.unsplash.com, raiyansoft.com, nader32.com); confirmed via `grep -rn "from 'next/image'" src` → 0 results, and `grep -rnE '<Image[ />]' src` → 0 results (the only `<Image` matches found earlier were `<ImagePlus`/`<ImageUpload`, unrelated component names)
Severity:         P2
Why it matters:   All 26 raw <img> tags render remote images (book covers, clinic photos, trip photos, community post images, encyclopedia thumbnails) from the exact domains next.config.ts allowlists for optimization, but bypass next/image entirely — so there's no automatic responsive sizing, no lazy-loading-by-default, no format negotiation (AVIF/WebP), and no CLS protection from width/height, for every image in the app. The remotePatterns config is currently unused.
Current behavior: Plain <img src=... className="h-44 w-full object-cover" /> everywhere; sizing is CSS-only (Tailwind height/width utility classes), so the browser has no intrinsic dimensions until the image loads (real layout-shift risk on slow connections).
Recommended solution: Not a blanket rewrite (visual output must stay identical, and next/image's default fill/sizing behavior differs from the current CSS object-cover approach) — swap `<img>` → `next/image`'s `<Image fill className="object-cover" sizes="..."/>` pattern file-by-file starting with the highest-traffic list pages (CourseCard.tsx, BookCard.tsx, trips-page.tsx, encyclopedia-list.tsx), since `fill` + the existing `object-cover` class preserves the current look exactly while adding real optimization.
Risk:             Low-medium — `fill` requires the parent to be `position: relative` with defined dimensions, which these cards already have via their height utility classes; verify each conversion doesn't shift layout.
Verification method: Lighthouse "Image elements do not have explicit width and height" / "Serve images in next-gen formats" audits before/after; visual diff on converted pages.
Status:           Open
```

### B5 (task item 10). Radix Dialog usage without `DialogTitle`

`grep -rl '<Dialog\|DialogContent' src` returns only `src/components/ui/dialog.tsx` and `src/components/ui/command.tsx` (the definition files themselves) — **the shared Radix `Dialog` component is not consumed by any feature**. `DialogTitle` similarly only appears in those 2 definition files. This means there's currently no live Radix-Dialog-without-title risk in the app simply because Dialog isn't used anywhere yet — all real modals are the hand-rolled `fixed inset-0` pattern from A2, which don't go through Radix at all (so no Radix runtime warning applies, but see A2 for the consistency/robustness gap that creates).

```
Issue:            Shared Radix-backed Dialog primitive (src/components/ui/dialog.tsx) has zero consumers
Location:         src/components/ui/dialog.tsx (defined, unused)
Severity:         P3
Why it matters:   Dead code path; also means the "Radix Dialog without DialogTitle" failure mode this audit item was checking for cannot currently occur, because Dialog isn't wired into any screen yet. Once A2's hand-rolled modals are migrated to it, `DialogTitle`/`DialogDescription` presence should be re-checked per conversion.
Current behavior: N/A — unused.
Recommended solution: No action needed until A2 conversions begin; at that point require every DialogContent consumer to include DialogTitle (visually hideable via `sr-only` if the design doesn't want a visible title).
Risk:             None.
Verification method: Re-run this check after any A2 migration.
Status:           Open
```

### B6 (task item 11). Heading hierarchy

`src/app/*` route files themselves contain almost no headings directly (`<h1>` in only 2 App Router page files: `not-found.tsx` and `trips/[tripId]/initial-consultation/page.tsx`) — this is expected, since routes are thin per AGENTS.md and delegate to feature page components, which do carry `<h1>` (59 occurrences across 51 feature files, one `<h1>` per top-level page component — a healthy pattern overall).

```
Issue:            Layout shells and their content headers both render an <h1>, risking two <h1>s on the same rendered page
Location:         src/features/admin/components/admin-shell.tsx:141 (`{title && <h1 ...>{title}</h1>}`) and src/features/admin/components/admin-page-header.tsx:15 (`<h1 ...>{title}</h1>`) — both take a `title` prop and both render it as an `<h1>`; if a page renders AdminPageHeader inside AdminShell with a title passed to both, that page gets two <h1>s.
Severity:         P2
Why it matters:   Two `<h1>`s on one page confuses screen-reader "jump to heading" navigation and is a WCAG-adjacent good-practice violation (not a hard failure, but muddies the page's single top-level landmark).
Current behavior: Not confirmed to co-occur in this static pass (would require checking every admin page's actual composition of AdminShell + AdminPageHeader), but both components independently default to <h1> for the same conceptual "page title" slot, which is the root cause regardless of whether a specific page currently double-renders it.
Recommended solution: Pick one owner for the page-level <h1> — most naturally AdminPageHeader (used inside content) — and change AdminShell's `title &&` branch to an <h2> or drop it, so the two components can't collide by construction. Zero visual change if both currently render the same size class.
Risk:             Low — verify no admin page currently relies on AdminShell's h1 rendering when AdminPageHeader isn't present (some pages might only use one or the other).
Verification method: `grep -rn 'AdminShell\|AdminPageHeader' src/app/(admin)` to enumerate every page, then check each renders exactly one h1.
Status:           Open
```

### B7 (task item 13). RTL / lang — DEFERRED per AGENTS.md, reporting only

```
Issue:            Root <html> lang/dir attributes are hardcoded to Arabic/RTL regardless of the active LanguageContext state
Location:         src/app/layout.tsx:19 (`<html lang="ar" dir="rtl" className={alexandria.variable}>`)
Severity:         P2 (reported per audit scope; DEFERRED — AGENTS.md explicitly excludes i18n/RTL work from the current engineering rollout; no fix proposed)
Why it matters:   If a user switches to English via LanguageContext (client-side), the document's `lang`/`dir` attributes never update — screen readers keep announcing English content with Arabic pronunciation rules, and `dir="rtl"` stays applied to what may now be LTR content. globals.css does correctly scope input/textarea direction to `html[dir="rtl"]`/`html[dir="ltr"]` selectors (a reasonable, already-good mechanism) but that mechanism only works if `dir` on `<html>` is ever actually toggled — currently it never is.
Current behavior: Static `lang="ar" dir="rtl"` set once at the root layout (a Server Component), never touched again client-side.
Recommended solution: Per AGENTS.md this is explicitly deferred — noted here as a finding, no fix recommended in this audit. When i18n work resumes, `.cursor/rules/i18n.mdc` is the stated place to pick this up.
Risk:             N/A — deferred.
Verification method: N/A — deferred.
Status:           Open (deferred by project decision)
```

### B8 (task item 12). Form errors association — see A5 above (same finding, filed once to avoid duplication).

---

## PART C — Static performance

### C1 (task item 15). Heavy module-level data / large root files — the headline perf finding

```
Issue:            Six large context providers live at the project ROOT (outside src/) and are imported directly into the client bundle via a relative path from src/app/providers.tsx, wrapping the entire app tree
Location:         src/app/providers.tsx:1-16 — `'use client'` file that imports `LanguageContext.tsx` (74,094 bytes / 72.4KB), `CurrencyContext.tsx` (1.8KB), `BlogContext.tsx` (3.3KB), `ResearchContext.tsx` (3.6KB), `TheoryContext.tsx` (3.5KB), `CourseCommentContext.tsx` (3.0KB) — all via `'../../<Name>'` relative imports (project root, two levels above src/app/). All six providers wrap `{children}` for every single route.
Severity:         P1
Why it matters:   LanguageContext.tsx alone is 72.4KB of source (larger after AST/JS, before minification) and, being imported by a 'use client' entry that sits above every route in the tree, ships to the client on every single page load — this is very likely the single largest static contributor to the client JS bundle in the app, and it can't be route-split away since it's mounted at the Providers root.
Current behavior: All 6 root context files load eagerly and un-code-split for every route, including routes that may not need blog/research/theory/course-comment state (e.g. a checkout page probably doesn't need BlogProvider or TheoryProvider mounted).
Recommended solution: Two independent, additive moves, neither requiring a rewrite: (1) confirm with `next build` bundle analysis (`ANALYZE=true` or `@next/bundle-analyzer`) how much of LanguageContext.tsx's 72.4KB is actual translation-string data vs logic — if it's mostly string maps, that data can be lazy-loaded/split from the Provider component itself without touching the Provider's public API; (2) the four narrower providers (Blog/Research/Theory/CourseComment) are candidates for narrowing their mount point to just the route groups that use them instead of the global root, if their consumers are confined to specific feature routes — needs a consumer audit before moving (out of scope for this read-only pass, flagged for follow-up).
Risk:             Medium for the Provider-scoping move (must verify no cross-feature consumer of e.g. TheoryProvider outside its expected route group before narrowing its mount point); low for the bundle-analysis step (purely diagnostic).
Verification method: `next build` output's First Load JS per route before/after; `@next/bundle-analyzer` treemap showing LanguageContext.tsx's contribution.
Status:           Open
```

```
Issue:            Root-level data.ts (35.5KB) is confirmed dead code — zero importers anywhere in the project
Location:         data.ts (project root, 35,536 bytes)
Severity:         P3
Why it matters:   Not a shipped-bundle problem (nothing imports it, so nothing ships) — but it's stale, unmaintained mock data (`MOCK_INSTRUCTORS`, etc.) sitting at the project root that could confuse a future contributor into thinking it's live. Confirmed via exhaustive project-wide grep for any relative or aliased import of `data.ts` / `MOCK_INSTRUCTORS` — 0 matches outside the file itself.
Current behavior: Unreferenced file.
Recommended solution: Safe to delete whenever someone is doing repo hygiene; not urgent, zero runtime effect either way.
Risk:             None.
Verification method: `grep -rln "MOCK_INSTRUCTORS" . --include=*.ts --include=*.tsx | grep -v node_modules` stays empty; delete; `npm run build` still succeeds.
Status:           Open
```

### C2 (task item 16). Eager imports of heavy libs in client components

```
Issue:            motion/react is imported eagerly (no next/dynamic) in 7 feature components that are not always visible on first paint
Location:         src/features/ai-assistant/components/ai-chat-widget.tsx; src/features/books/components/book-reader.tsx; src/features/clinic/components/clinic-booking-detail.tsx; src/features/consultations/components/consultation-detail.tsx; src/features/health-assessment/components/health-assessment-page.tsx; src/features/learning/components/quiz-player.tsx; src/features/library/components/encyclopedia-detail.tsx (all confirmed via `grep -rln "from 'motion/react'" src`)
Severity:         P2
Why it matters:   `motion` (Framer Motion successor) is a non-trivial animation runtime; ai-chat-widget.tsx in particular is mounted globally via Providers (src/app/providers.tsx:19, `<AIChatWidget />`) on every route, so its `motion/react` import ships everywhere even on pages where the chat widget is never opened.
Current behavior: Direct top-of-file `import { motion } from 'motion/react'` in all 7 files; no `next/dynamic(() => import(...), { ssr: false })` boundary around any of them.
Recommended solution: For the globally-mounted AIChatWidget specifically, wrap its default export with `next/dynamic` (loading state can be `null` since it's a floating widget with no layout impact) so `motion/react` only loads once the widget code-splits in — zero visual change, same widget, later paint. The other 6 are page-level feature components already route-code-split by the App Router, so their `motion/react` cost is already scoped to their own route; lower priority.
Risk:             Low — dynamic import of a floating/overlay widget is one of the safest next/dynamic use cases (no CLS risk since it has no reserved layout space).
Verification method: Bundle analyzer showing motion/react moved out of the shared/root chunk into a lazy chunk; visual check that the chat widget still opens identically.
Status:           Open
```

`jspdf`, `react-markdown`, and `@google/genai` are listed dependencies but have **zero imports anywhere in src** (`grep -rln 'jspdf'`, `grep -rln 'react-markdown'`, `grep -rln '@google/genai'` all return empty) — confirmed dead dependencies, not an eager-import problem since they're never loaded at all. Flagged under C4 (dependency hygiene) rather than here. `isomorphic-dompurify` is used in exactly 1 file (`src/components/ui/rich-text.tsx`) and `cmdk` in exactly 1 file (`src/components/ui/command.tsx`) — both already minimally scoped, no action needed.

### C3 (task item 17). Icon imports

Clean. All 60 files importing `lucide-react` use named imports (`import { X, Check } from 'lucide-react'` style) — `grep -rn "import \* as.*lucide-react" src` → 0 matches. No barrel/wildcard imports found; this already follows the tree-shakeable pattern AGENTS.md asks for (`size` prop preference wasn't separately re-verified here but the import style itself is correct).

### C4. Duplicate / unused dependencies

```
Issue:            jspdf, react-markdown, and @google/genai are installed dependencies with zero usage in src
Location:         package.json:7 (`@google/genai`), :24 (`jspdf`), :26 (`react-markdown`)
Severity:         P3
Why it matters:   Install-size and lockfile bloat, plus supply-chain surface for code that isn't even used; also potentially confusing given the AI-assistant feature exists (ai-chat-widget.tsx) but doesn't use @google/genai directly — worth confirming whether genai calls happen server-side outside src (e.g. in `backend/`, which is a separate PHP-style directory at the repo root per the pre-existing B3_Academy_Frontend_Audit.md, out of this audit's scope) before removing.
Current behavior: Unused in the Next.js app.
Recommended solution: Confirm with whoever owns the AI-assistant feature whether @google/genai is meant to be called from a src/app/api route that just hasn't landed yet, then either wire it up or remove the dependency. Same check for jspdf (likely intended for a PDF export feature) and react-markdown (likely intended for rendering markdown content, note rich-text.tsx already uses isomorphic-dompurify for a different purpose — sanitizing HTML, not rendering markdown).
Risk:             Low to remove if genuinely unused; verify no server-route usage first.
Verification method: `grep -rln "@google/genai\|jspdf\|react-markdown" src` stays empty; check `src/app/api/**` specifically.
Status:           Open
```

### C5 (task item 18). Raw `<img>` without width/height — see B4 (same evidence, filed once).

### C6 (task item 20). Lists without virtualization

No `react-window`/`react-virtual`/`Virtualize` usage found anywhere (`grep -rln 'virtual\|Virtualize\|react-window\|react-virtual' src` → 0 matches), and none of these packages are installed. 126 files use `.map(` for list rendering. Spot-checked candidates for realistically large lists: `encyclopedia-list.tsx` (news/picks/herbs — likely tens of items, paginated or API-limited server-side per `encyclopedia.service.ts`), `trips-page.tsx`, `home-page.tsx`. None showed evidence of unbounded client-side arrays (list sources are service calls, not large inline constants) — **no virtualization gap severe enough to flag** at this time; this is a clean area given current data volumes. Revisit if any list's backing API stops paginating.

---

## Appendix — counts referenced above (for re-verification)

```
raw <img> tags:                          26  (grep -rn '<img' src | wc -l)
next/image <Image> component usage:       0  (grep -rnE '<Image[ />]' src)
dark: class usages:                      18  (grep -rn 'dark:' src | wc -l)
theme provider/toggle files:              0  (grep -rli 'theme' src --include=*.tsx --include=*.ts)
aria-label occurrences:                  16  (grep -rn 'aria-label' src | wc -l)
sr-only occurrences:                      2  (grep -rn 'sr-only' src | wc -l)
htmlFor= occurrences:                     1  (grep -rn 'htmlFor=' src | wc -l)
aria-invalid / aria-describedby:          4  (grep -rn 'aria-invalid\|aria-describedby' src)
FormFieldError consumers (excl. def.):    0
ErrorAlert/toastError files:              14 (toastError working as intended)
SubmitButton consumers:                   3
useForm()/react-hook-form files:          1  (src/lib/forms/use-app-form.ts, 2 downstream consumers)
zod schema files:                         3
div/span onClick occurrences:             0
Button size="icon" usages:                0
lucide-react importing files:            60  (all named imports, no wildcard)
motion/react eager-import files:          7
h1 in src/app route files:                2
h1 in src/features page components:      59  (51 files)
fixed inset-0 custom modals:              9 files
Dialog/DialogContent consumers (feature): 0  (only definition files)
data.ts importers:                        0  (dead file, 35.5KB)
LanguageContext.tsx importers:            1  (src/app/providers.tsx, ships globally, 72.4KB source)
```
