# Vercel React Best Practices Audit — Waterfalls & Bundle Size

Scope: Category 1 (Eliminating Waterfalls, `async-*`) and Category 2 (Bundle Size
Optimization, `bundle-*`) only, per
`C:\Users\abdallah\.claude\skills\vercel-react-best-practices\rules\`. `backend/`
excluded from all searches.

Methodology: rule files read in full before auditing (not from memory). Every
finding below is grounded in a source read or grep in this repo, or a real
`.next` build produced by `npm run build` (Next.js 16.3.4, Turbopack) run
during this audit. Where the build's chunk-splitting made a number unreliable,
that is stated explicitly instead of guessed.

## Build facts used throughout this report

- `npm run build` (Turbopack) completed clean: 94 routes, 69 statically
  prerendered, 25 dynamic (`ƒ`).
- `.next/static/chunks`: 127 JS files, 3.9MB total (uncompressed); plus one
  89KB CSS file.
- `next.config.ts` has **no** `experimental.optimizePackageImports` block —
  it only configures `images.remotePatterns`.
- `lucide-react` is on Next.js's **default** `optimizePackageImports` list
  (confirmed by reading `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/optimizePackageImports.md`);
  `radix-ui` is **not** on that default list.
- `next/dynamic`: zero usages anywhere in `src` (grep-confirmed).
- Runtime `import()` code-splitting: zero usages anywhere in `src` (the only
  two `import(...)` hits are TypeScript type-only imports in
  `src/features/auth/types/auth.types.ts`, not runtime code-splitting).
- `'use server'` Server Actions: zero. `src/app/api`: does not exist.
- `index.ts` / `index.tsx` barrel re-export files under `src/`: zero
  (`find src -name index.ts -o -name index.tsx` returns nothing).
- 90 of 94 `page.tsx` files are `'use client'` (grep-confirmed), root-caused
  by `src/lib/routing/next-router-compat.tsx`.

---

## Findings — Category 1: Eliminating Waterfalls

```
Rule:                async-suspense-boundaries
Issue:                90 of 94 routes are forced client-side by the router-compat shim, which makes the rule's core pattern (async Server Component + <Suspense> streaming) structurally unavailable — there is no server data-fetching phase left to stream.
Location:             src/lib/routing/next-router-compat.tsx (whole file, 'use client' shim providing useParams/useNavigate/useLocation/Link/Navigate); src/app/(site)/books/page.tsx:1-16 (the one page that still does this correctly)
Severity:             P1
Why it matters:       The rule's whole premise is "show the wrapper UI faster while data loads" via a Suspense boundary around an async Server Component. On a 'use client' page there is no async Server Component to wrap — data only starts loading after the full route JS has downloaded, parsed, and hydrated, and a client-side react-query hook has mounted. The one exception, src/app/(site)/books/page.tsx, starts both prefetchQuery calls in parallel at request time (before any client JS ships) and hands the result down via HydrationBoundary — this is the reference pattern the other 90 pages cannot use today.
Current behavior:     Every non-books route fetches all of its data client-side, after hydration, via react-query hooks inside 'use client' page components.
Recommended solution: Already tracked as a larger, postponed fix (replacing next-router-compat.tsx with real server params/searchParams so pages can become Server Components again). Recently-added src/app/**/loading.tsx (6 route groups) and error.tsx (9 route groups) give route-level Suspense/error boundaries for navigation transitions, but they mask JS-download/hydration latency, not data-fetch latency — they do not substitute for the server-streaming pattern this rule describes.
Measured impact:      not measured (would require a Lighthouse/RUM trace under throttled network comparing TTFB-to-data-visible on a client page such as /courses versus /books); qualitatively, every client page pays a full hydrate-before-fetch tax that /books avoids.
Risk:                 Not assessed here — the underlying fix is out of scope for this audit (explicitly flagged as already postponed); this entry documents the performance cost only.
Verification method:  Lighthouse or PerformanceObserver trace comparing time-to-first-data-paint on a representative client page vs. /books, before/after any Server Component migration.
Status:               Open
```

## Rules checked — no violations

- `async-parallel` — No violations found. `src/app/(site)/books/page.tsx` (the only true server component with data fetching) correctly uses `Promise.all([...])` for its two independent `prefetchQuery` calls. Elsewhere `Promise.all` is already used appropriately in `src/features/library/services/encyclopedia-api.service.ts`, `src/features/library/hooks/use-encyclopedia-api.ts`, and `src/features/courses/hooks/use-course-api.ts`.
- `async-dependencies` — No violations found. No dependency-chained `await` sequences (`await A(); const y = await B(x)`) were found in components or services; every `services/*.ts` function inspected (`trips-api.service.ts`, and a swept sample of the other 30 service files with 2+ `await`s) is a set of independent single-`await` fetch wrappers, not one function chaining multiple sequential fetches.
- `async-defer-await` — No violations found. Event handlers (e.g. `src/features/account/components/settings-page.tsx`, `src/features/auth/components/auth-page.tsx`, `src/features/learning/components/course-player.tsx`) each perform a single `await` gated by an early return, not an unconditional await ahead of a skip branch.
- `async-cheap-condition-before-await` — No violations found. The one flag-gated render path found, `isAssistantEnabled()` in `src/features/ai-assistant/components/ai-chat-widget.tsx:85`, is a synchronous check with no `await` involved (its problem is a bundle-loading one — see `bundle-conditional` below — not an async-ordering one).
- `async-api-routes` — No surface. `src/app/api` was already deleted (confirmed) and there are zero `'use server'` Server Actions anywhere in `src` (grep-confirmed). This rule has nothing to audit in this codebase.

---

## Findings — Category 2: Bundle Size Optimization

```
Rule:                bundle-dynamic-imports
Issue:                AIChatWidget (which imports motion/react) is statically imported and unconditionally mounted in the root layout tree, shipping to every one of the app's 94 routes even though it is a floating overlay not needed for first paint or SEO, and even renders null when disabled.
Location:             src/app/providers.tsx:3 (import), src/app/providers.tsx:17 (<AIChatWidget /> mount); src/app/layout.tsx:21 (single root layout wraps every route in <Providers>, no route escapes it); src/features/ai-assistant/components/ai-chat-widget.tsx:3 (import { motion, AnimatePresence } from 'motion/react')
Severity:             P0
Why it matters:       This is structurally identical to the rule's own incorrect example (an <Analytics /> component mounted unconditionally in RootLayout). Zero next/dynamic usage exists anywhere in this app, so this exact pattern — the rule's headline use case — is never applied.
Current behavior:     motion/react plus the widget's own code compile into a chunk that ships on every route regardless of whether the assistant is enabled.
Recommended solution: const AIChatWidget = dynamic(() => import('@/features/ai-assistant/components/ai-chat-widget').then(m => m.AIChatWidget), { ssr: false }) in providers.tsx.
Measured impact:      54.3KB (uncompressed) — confirmed by grepping the production build output for a string unique to this component's dependency chain (resolveAssistantReply), which matched exactly one chunk: .next/static/chunks/0dt08t6vcuu-h.js (54,355 bytes).
Risk:                 Low — the component is already client-only in practice (rendered inside a 'use client' Providers tree); ssr: false changes nothing observable.
Verification method:  Re-run npm run build after the change; grep the new output for the same marker string and confirm it no longer appears inside the root/shared bundle files (rootMainFiles in .next/build-manifest.json), only in an on-demand chunk.
Status:               Open
```

```
Rule:                bundle-conditional
Issue:                The assistant's own enable/disable check runs after the module (and motion) has already been downloaded and executed, so the flag can only hide the UI, not avoid loading it.
Location:             src/features/ai-assistant/components/ai-chat-widget.tsx:85-87 (if (!isAssistantEnabled()) { return null; })
Severity:             P0
Why it matters:       The rule is "load large data or modules only when a feature is activated" — here the activation check happens inside the already-imported component's render body, not before the import.
Current behavior:     The 54.3KB chunk described above (same chunk as the bundle-dynamic-imports finding) is fetched and parsed for every visitor regardless of isAssistantEnabled()'s result.
Recommended solution: Same fix as bundle-dynamic-imports above, applied together: gate the dynamic import itself on isAssistantEnabled() in providers.tsx (or check the flag before calling the dynamic import function) so a disabled assistant costs zero bytes, not just zero render.
Measured impact:      Same 54.3KB chunk (.next/static/chunks/0dt08t6vcuu-h.js) as above; if the assistant is ever disabled in a given environment, that cost today buys nothing.
Risk:                 Low.
Verification method:  Same as bundle-dynamic-imports — confirm via Network tab / build chunk graph that the chunk is not requested when the flag is off.
Status:               Open
```

```
Rule:                bundle-conditional
Issue:                The full en/ar/fr/es translation dictionary is bundled and shipped on every route for every session, even though only one locale is ever rendered at a time.
Location:             LanguageContext.tsx:17 (const translations = {...}, a single 583-line object literal inlining all 4 languages per key), imported by src/app/providers.tsx:2 and mounted for every route via src/app/layout.tsx:21
Severity:             P1
Why it matters:       Same rule as above, applied to data instead of a component: "load large data or modules only when a feature is activated." Three of four languages' strings are dead weight on every single page view.
Current behavior:     LanguageContext.tsx is 72.4KB / 583 lines on disk and compiles to a 68.5KB JS chunk (confirmed by grepping the build output for a string unique to the dictionary, "Reclaim Your Health", which matched exactly one chunk: .next/static/chunks/07svud55iv-f3.js, 68,500 bytes). It loads on every route regardless of the active language.
Recommended solution: Split translations into one module per locale and load only the active one on demand (e.g. an explicit locale->loader map per bundle-analyzable-paths, not a template-string path), with the default locale (ar, per <html lang="ar"> in layout.tsx:19) inlined synchronously so first paint isn't blocked, and the other three loaded lazily when setLanguage switches to them.
Measured impact:      68.5KB shipped on every route; roughly 75% of that (3 of 4 languages) is unused in any single session.
Risk:                 Medium — touches the t()/localize() API surface used app-wide; needs a brief loading/fallback state for the async path.
Verification method:  Re-run npm run build, confirm the default-locale chunk shrinks to roughly 1/4 of 68.5KB, and confirm no regression (flash of untranslated text) on language switch.
Status:               Open
```

```
Rule:                bundle-barrel-imports
Issue:                3 files import Radix primitives via the radix-ui meta-package, which is not in Next.js's default optimizePackageImports list and is not added manually in next.config.ts.
Location:             src/components/ui/dialog.tsx:5 (import { Dialog as DialogPrimitive } from "radix-ui"), src/components/ui/popover.tsx:4, src/components/ui/scroll-area.tsx:4; next.config.ts (no experimental.optimizePackageImports block at all)
Severity:             P1
Why it matters:       The rule names @radix-ui/react-* directly among affected libraries and describes exactly this file shape. Reading node_modules/radix-ui/dist/index.mjs directly confirms it: 32 `import * as X from "@radix-ui/react-*"` statements followed by one re-export block — the canonical barrel file the rule warns about. lucide-react (57 files) does not need this fix because it is on Next's default-optimized list (confirmed by reading node_modules/next/dist/docs/.../optimizePackageImports.md); radix-ui is not on that list.
Current behavior:     Importing from "radix-ui" resolves through a barrel that statically imports all 32 Radix primitive sub-packages before re-exporting the 3 that are actually used (Dialog, Popover, ScrollArea).
Recommended solution: Add experimental.optimizePackageImports: ['radix-ui'] to next.config.ts. This keeps the existing from "radix-ui" import syntax at all 3 call sites unchanged and matches the rule's recommended Next.js 13.5+ approach.
Measured impact:      Not reliably isolable as a runtime KB number in this build — node_modules/radix-ui/dist/index.mjs is only 60KB on disk (it re-exports rather than duplicates code, and each @radix-ui/react-* subpackage is resolved separately by the bundler in practice) — so this is reported per the rule's stated cost (slower builds, wider module graph, worse cold starts) rather than an invented byte figure.
Risk:                 Very low — one-line config addition, zero call-site changes.
Verification method:  Add the config, re-run npm run build (compare wall time) and npm run dev cold start, and confirm the change is a pure config diff with no visual/behavioral regression in Dialog/Popover/ScrollArea usages.
Status:               Open
```

```
Rule:                bundle-dynamic-imports
Issue:                Several heavy, deferrable client dependencies are imported eagerly at module scope even though the UI that needs them starts hidden/collapsed.
Location:             src/components/ui/phone-input.tsx:5-6 (import * as RPNInput from 'react-phone-number-input'; import flags from 'react-phone-number-input/flags';) — flags alone is ~250 per-country SVG components, loaded even though CountrySelect's popover (phone-input.tsx:84-143) starts closed; consumed by src/features/account/components/settings-page.tsx, src/features/auth/components/auth-page.tsx, src/features/admin/components/admin-user-new-page.tsx, src/features/admin/components/admin-user-edit-page.tsx, src/features/account/components/account-sections/profile-page.tsx
Severity:             P2
Why it matters:       The rule recommends next/dynamic for large components not needed on initial render; the country-search dropdown is only visible after a user clicks the flag/chevron button, which is a textbook deferral candidate. Zero next/dynamic usage exists anywhere in the app (grep-confirmed) to compare against.
Current behavior:     react-phone-number-input, its flags subpackage, and the cmdk-based Command primitives (src/components/ui/command.tsx) all load synchronously as soon as any page importing PhoneInput mounts.
Recommended solution: Wrap CountrySelect (or just its Command + flags dependency) in next/dynamic(() => import(...), { ssr: false }), triggered on first focus/click of the country trigger button, similar to the rule's "preload on hover/focus" pattern for the popover open action.
Measured impact:      Not reliably attributable from this build. Two chunks match a string unique to this component (.next/static/chunks/16jzh9nbefn0v.js, 340,207 bytes and .next/static/chunks/2zayiy_r8rwcj.js, 197,231 bytes), but both are also referenced from all 360 route client-reference-manifest.js entries — the same reference signature the genuinely-global providers.tsx modules show. That signature is not proof of global shipping here (phone-input is only imported by 5 route files), so it most likely reflects Turbopack merging this code into a larger shared/vendor chunk rather than an isolated per-component cost. Stating this explicitly rather than reporting an unverified number.
Risk:                 Low-medium — the country picker sits inside forms with keyboard/validation wiring; needs a loading fallback that matches the current trigger-button layout to avoid shift.
Verification method:  Apply next/dynamic to CountrySelect, rebuild, and check whether a distinctly-sized, low-reference-count chunk appears — that would confirm true isolation, unlike the current ambiguous shared-chunk signature.
Status:               Open
```

## Rules checked — no violations

- `bundle-barrel-imports` (lucide-react, internal barrels) — `lucide-react` is imported with named imports (`import { X, Y } from 'lucide-react'`) across all 57 files that use it, which is exactly the rule's recommended syntax, and it is on Next.js's default `optimizePackageImports` list, so no config change is even required. Separately, `find src -name index.ts -o -name index.tsx` returns zero files — there are no internal barrel re-export files under `src/features/**` or `src/components/**` to flag.
- `bundle-analyzable-paths` — No violations found. There are zero dynamic `import()` calls anywhere in `src` (runtime code-splitting is entirely unused), so there is no computed/variable import path to evaluate against this rule.
- `bundle-defer-third-party` — No surface. `package.json` has no analytics, logging, or error-tracking third-party libraries (no `@vercel/analytics`, no Sentry, no equivalent) to defer.
- `bundle-preload` — Not applicable today. The rule preloads a bundle that has already been split out via `next/dynamic`/`import()`; since zero dynamic imports exist anywhere in this app, there is nothing to attach a hover/focus preload to yet. This becomes actionable only after the `bundle-dynamic-imports` findings above are implemented.
