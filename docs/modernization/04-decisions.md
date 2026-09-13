# 04 — Decisions

Engineering decisions taken during modernization, with the reasoning, so nobody has
to re-derive them. Newest last.

---

### D1 — No framework upgrades; the stack is already current

**Decision:** Do not upgrade Next.js, React, Tailwind, or TanStack Query.

**Why:** The project is already on Next 16.2, React 19.2, Tailwind 4.3, TanStack
Query 5.101 and zod 4.4. There is nothing to modernize *to*. The audit's value is in
architecture, correctness and type safety, not version numbers. Hard rules 2 and 3
forbid blind upgrades, and there was no compatibility reason to force one.

---

### D2 — Lint gate fixed by scoping, not by relaxing rules

**Decision:** Add `backend/**` to `globalIgnores` in `eslint.config.mjs`.

**Why:** `npm run lint` was reporting 18,380 problems (1,845 errors) and therefore
always failing with `--max-warnings=0`. Every one of those errors came from
`./backend/` — a separate Laravel application, vendored as its own git repo and
already listed in this project's `.gitignore`. ESLint's flat config does not read
`.gitignore`, so it was walking in and linting the Laravel app's bundled and
PHP-adjacent JavaScript with a Next.js config.

Scoped to the real frontend, `npx eslint src` reported **3 problems, 0 errors**. So
the "18,380 problems" figure was a measurement artifact, not technical debt — worth
stating plainly because it would otherwise look like a catastrophic codebase.

**Rejected alternative:** raising `--max-warnings` or disabling more rules. That
would have hidden a config bug behind a weaker gate, and hard rule 15 forbids
disabling checks to make them pass.

---

### D3 — The 3 remaining lint warnings fixed honestly, not silenced

**Decision:** Fix the `react-hooks/exhaustive-deps` warnings by memoizing the unstable
values, rather than adding `eslint-disable` comments or padding dependency arrays.

**Why:** Both were real.
- `booking-slot-selector.tsx:32` built `filters` as a fresh object every render, used
  it inside two `useMemo`s, and listed its constituent fields as dependencies instead.
  Behaviour was accidentally correct; the lint rule simply couldn't see through the
  object. Wrapping `filters` in its own `useMemo` and depending on it recomputes under
  exactly the same conditions — behaviour-preserving, and now honest.
- `chat-consultation.tsx:44` had `messages = messagesQuery.data?.items ?? []`, which
  produced a new array identity on every render, so the scroll-to-bottom `useEffect`
  fired on *every* render rather than on new messages. Memoizing it is a genuine small
  behaviour fix, not just lint appeasement.

`npm run lint` now exits 0, so it is usable as a real gate for the first time.

---

### D4 — `npm audit fix` accepted, including the minor framework bump it carried

**Decision:** Run `npm audit fix` and keep the result, which moved
`next` 16.2.9 → 16.3.4 and `react`/`react-dom` 19.2.1 → 19.2.5.

**Why:** `npm audit` reported 12 vulnerabilities, **10 of them high severity**, in
transitive `undici` and `ws` — response desynchronization, cross-user information
disclosure, CRLF injection, uninitialized memory disclosure, and a memory-exhaustion
DoS. All were fixable without `--force`. Leaving 10 high advisories in place was not
defensible.

**On the framework bump — this deserves scrutiny given hard rules 2 and 3.** The
bump is *within the caret ranges already declared in `package.json`* (`^16.2.9`,
`^19.2.1`), so `package.json` did not change and any fresh `npm install` on a clean
clone would have produced the same versions. It is a lockfile refresh, not a
migration. I did not treat that as self-evidently safe: it was verified with the full
suite afterwards — typecheck 0 errors, 59/59 tests, lint exit 0, build exit 0.

One transient signal was investigated and dismissed: the IDE briefly reported
`useSearchParams` missing from `next/navigation` during the reinstall. `npx tsc
--noEmit` returned 0 errors and the import is valid in Next 16, so this was a stale
TS-server diagnostic, not a real break.

**If this bump is unwanted,** pin exact versions in `package.json` and re-run
`npm install`. The security fix can be kept independently of the framework bump by
pinning `next`/`react` while allowing the transitive patches through.

**Result:** 12 vulnerabilities → **0**.

---

### D5 — Six unused dependencies removed

**Decision:** Remove `@google/genai`, `jspdf`, `react-markdown`,
`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`.
134 packages left the tree.

**Why:** All six had zero importers, verified with a quote-agnostic ripgrep across
every `.ts`/`.tsx` outside `backend/` and `node_modules/`, plus an explicit check for
dynamically constructed `import(...)` calls. `@google/genai` was the notable one — it
implied an AI integration that does not exist: `src/app/api/ai/chat/route.ts` is a
10-line stub returning a constant string, and the on-page assistant does local
keyword lookup instead. The three individual `@radix-ui/*` packages were redundant
because the `radix-ui` meta package already provides those primitives, and importing
Radix two ways invites two copies of one primitive in a bundle.

**A correction worth recording:** my first pass reported `radix-ui` itself as having
zero importers and nearly removed it. That was a false negative from a single-quoted
grep pattern — `scroll-area.tsx`, `popover.tsx` and `dialog.tsx` all use
double-quoted specifiers. The lesson is that "no importers" from a static search is a
hypothesis, not a fact, until the quoting is quote-agnostic and a clean build confirms
it. Every removal here was confirmed by a passing build.

**Kept:** `radix-ui` (3 importers), `@radix-ui/react-slot` (1), `cmdk` (1),
`input-otp` (2), `isomorphic-dompurify` (1).

---

### D6 — Staged `strict` migration, starting with the flags that cost nothing

**Decision:** Leave `strict: false` for now, but explicitly enable the five flags
measured at **0 errors**: `strictFunctionTypes`, `strictBindCallApply`,
`noImplicitThis`, `useUnknownInCatchVariables`, `alwaysStrict`.

**Why:** `strict: true` costs 24 errors in total, and the cost is almost entirely
concentrated in two flags — `strictNullChecks` (26 errors measured alone) and
`noImplicitAny` (12). The other five are free. Enabling them immediately locks in
permanent protection at zero risk and shrinks what remains to a single, well-understood
piece of work.

Doing it in stages rather than one flip means each flag's errors can be fixed and
verified in isolation, per hard rule 22 (incremental, reversible). The remaining two
flags are Batch 3, sequenced *after* zod validation lands at the API boundary —
because `strictNullChecks` is only telling the truth once network data is actually
validated rather than blind-cast. Turning it on first would produce types that claim
non-nullability the runtime doesn't guarantee.

The tsconfig carries a comment recording the measured numbers so the next person
doesn't re-measure.

---

### D7 — `middleware.ts` → `proxy.ts`

**Decision:** Rename `src/middleware.ts` to `src/proxy.ts` and rename the exported
function from `middleware` to `proxy`.

**Why:** Next 16 deprecated the `middleware` file convention. This was not assumed —
it was confirmed two independent ways: the project's own `npm run build` emitted
`⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`, and
Context7's Next.js docs confirmed the exact contract (a file exporting a function
either as default or named `proxy`, with `config`/`matcher` unchanged). Verifying
before renaming mattered here, because guessing the export name would have produced a
build error telling me the file "must export a function".

The logic itself is untouched. The build deprecation warning is gone.

**Note:** `proxy.ts` runs on the Node.js runtime only and cannot be configured to run
on the edge. Irrelevant for this project — the file never set a runtime.

---

### D8 — Context7 configured with the key kept out of git

**Decision:** Add a project `.mcp.json` declaring `context7` (HTTP transport) and
`shadcn`, with the API key referenced as `${CONTEXT7_API_KEY}` and its actual value
stored in `.claude/settings.local.json`, which is gitignored.

**Why:** The key had to be usable by the project without being committed. Putting the
literal token in `.mcp.json` would have published it the moment anyone committed, and
`.gitignore` did not previously cover any Claude Code settings file. So: placeholder
in the shareable file, real value in a local file, and an explicit `.gitignore` entry.
Verified with `git check-ignore -v` that git cannot see the token, and with a search
across tracked and untracked-but-not-ignored files that the literal key appears
nowhere git would pick up.

The `context7` entry's shape was copied from the already-working global configuration
rather than guessed, per hard rules 4-6 (do not invent MCP configuration). `shadcn`
mirrors the project's own pre-existing `.cursor/mcp.json` choice, so it is an
established project decision, not a new dependency on my part.

**Note:** MCP servers are loaded at session start, so this configuration takes effect
in the *next* session, not the current one. Context7 was already available globally
and was used throughout this work.

**Not added:** a filesystem MCP (native file tools already cover it — hard rule on not
duplicating capabilities) and a project-level Playwright entry (already available in
the environment; duplicating it would just create two browser servers).

---

### D9 — `.env` left tracked, deliberately

**Decision:** Do **not** run `git rm --cached .env`, despite it being tracked.

**Why:** It is tracked, which is a convention violation worth fixing — but nothing is
exposed. The only key in it is `NEXT_PUBLIC_API_BASE_URL`, and `cmp` confirms `.env`
is byte-identical to `.env.example`. So there is no secret to leak and no rotation
needed.

Untracking it would delete the file from every other contributor's working tree on
their next pull. That is a coordination decision affecting other people's local
setup, not a unilateral cleanup, so it is recorded as a recommendation in
`audit-hardening.md` (P3) for the repo owner to action with the team rather than
something I did to them mid-pass.

`tsconfig.tsbuildinfo` **was** untracked, because it is a machine-specific build
artifact with no coordination cost.

---

### D11 — Skills: a gap in my own process, corrected

**What went wrong.** Phase 2.3 of the brief asked for trustworthy current Skills
covering React best practices, Next.js best practices, performance, accessibility and
frontend security. I configured the **MCP servers** (Context7, shadcn) and then went
straight to auditing, without loading a single Skill. The user asked whether the
frontend had been run against the React best-practices skill. It had not.

This is worth recording as a process failure rather than quietly fixing, because the
consequence was substantive: the entire first audit pass was six subagents reasoning
from first principles plus Context7's API documentation. That is not the same as
checking against a maintained, opinionated rule set. Reasoning from principles finds
what you think to look for; a rule set finds what you didn't.

**What was available and unused:** `vercel-react-best-practices` — Vercel's own guide,
**70 rules across 8 categories**, each rule a separate file on disk with rationale and
incorrect/correct examples, prioritized by impact (waterfalls and bundle size rated
CRITICAL; JS micro-optimizations rated LOW).

**Concrete things the first pass never checked**, now covered:
- `rerender-no-inline-components` — components declared inside other components. Common,
  expensive, and nothing had looked for it.
- `rendering-conditional-render` — `&&` in JSX instead of a ternary, which can render a
  literal `0` or empty string.
- `bundle-barrel-imports` — how `lucide-react` and feature `index.ts` barrels are imported.
- `rerender-lazy-state-init` — `useState(expensive())` instead of `useState(() => …)`.
- `js-tosorted-immutable` — `.sort()` mutating arrays, which on TanStack Query cache data
  is a **correctness** bug, not a perf nit.
- `client-localstorage-schema` — this app persists a great deal of legacy local state,
  and none of it was assessed for versioning or unbounded growth.
- The whole `js-` and `advanced-` categories — 18 rules, entirely unexamined.

**How the correction was run.** Four subagents, split by rule category, each required to
**read the actual rule files from disk** rather than work from memory, to cite the exact
rule id per finding, and to list rules with *no* violations explicitly — so a clean
result is recorded as a result rather than looking like a gap. Findings land in
`audit-vercel-waterfalls-bundle.md`, `audit-vercel-server-client.md`,
`audit-vercel-rerender-rendering.md`, `audit-vercel-js-advanced.md`.

Severity discipline was set per category to match the guide's own priorities, with an
explicit instruction not to inflate micro-optimizations — a `.filter().map()` over a
five-item array is not a finding.

**Skills deliberately not loaded**, to avoid the "ten overlapping skills" the brief
warned against: `vercel-composition-patterns` and `vercel-react-view-transitions`
(narrower, and view transitions are a feature this app doesn't use);
`frontend-design` and `web-design-guidelines` (aesthetic direction — actively wrong
here, since preserving the existing visual identity is a hard requirement).

**Lesson for the rest of this effort:** load the domain Skill *before* auditing that
domain, not after being asked.

---

### D10 — The two highest-value fixes are postponed, on purpose

**Decision:** Do not attempt the session-model change or the router-shim retirement
in this pass. Both are documented in `02-plan.md` as Batch 9.

**Why:** Hard rule 23 — postpone changes that could cause significant breakage until
safer work is done. These are the two most valuable items in the whole audit, and
that is precisely why they should not be rushed alongside twenty smaller changes.

- **Session model.** The `b3_session` cookie is a client-written role string that
  `proxy.ts` trusts with `===` to gate `/admin` and `/doctor`. The correct fix is an
  httpOnly session cookie issued by the Laravel API, which would also move the bearer
  token out of `localStorage` and thereby unblock SSR credentials. It **requires a
  backend change**, so it is genuinely blocked on coordination, not on effort.
- **Router shim.** `src/lib/routing/next-router-compat.tsx` is a React-Router-shaped
  compatibility layer using client `useParams()`/`useSearchParams()`. Because of it,
  no `page.tsx` ever receives server `params` — which is the single root cause of
  90/94 pages being `'use client'`, 0/94 pages exporting metadata, and 1/94 pages
  server-prefetching. Retiring it touches nearly every route and deserves its own
  effort with its own regression budget.

Attempting either here would have meant a large, hard-to-review diff mixed in with
unrelated cleanup — the opposite of incremental and reversible.

---

### D12 — Do NOT add `experimental.optimizePackageImports` for the `radix-ui` barrel

**Decision:** Leave `next.config.ts` alone. The bundle audit's P1
`bundle-barrel-imports` finding against `radix-ui` is **not applicable to this build**.

**The finding was real as stated.** `node_modules/radix-ui/dist/index.mjs` genuinely is
a barrel — 32 `import * as X` re-exports — and `radix-ui` genuinely is absent from
`experimental.optimizePackageImports`. `lucide-react` was confirmed already handled.

**Why no change:** Context7's current Next.js documentation states that
`optimizePackageImports` applies **when not using Turbopack**, and that *"Turbopack
handles import analysis and optimization automatically without requiring this extra
configuration."* This project builds with Turbopack — verified, not assumed, from the
build banner:

```
▲ Next.js 16.3.4 (Turbopack)
```

There is no `--turbopack` flag anywhere in `package.json` or `next.config.ts`; it is the
Next 16 default. So the option would be inert at best, and at worst would be a config
line that a future reader believes is doing something.

**Why this is worth writing down rather than just skipping:** hard rules 6 and 21 —
verify against documentation matching the *installed* version instead of applying a
remembered fix. The remembered fix here is from the webpack era and is now obsolete.
The honest resolution of a P1 can be "the platform already does this."

**If Turbopack is ever disabled** (a `--webpack` build, or a downgrade below 16), this
finding becomes live again and `optimizePackageImports: ['radix-ui']` is the fix.

---

### D13 — Two self-corrections from re-measuring the disabled ESLint rules

**What happened:** I had recorded in `eslint.config.mjs` that
`react-hooks/set-state-in-effect` and `react-hooks/purity` together "report 15 warnings
today." The rerender/rendering Skill audit reported 16. It was right and I was wrong.

Re-measured directly:

```
$ npx eslint src --rule '{"react-hooks/set-state-in-effect":"warn","react-hooks/purity":"warn"}'
✖ 16 problems (0 errors, 16 warnings)
$ ... | grep -oE 'react-hooks/(set-state-in-effect|purity)' | sort | uniq -c
     16 react-hooks/set-state-in-effect
```

**Correction 1 — the count.** 16, not 15. The comment now carries the measured figure
and the split, and notes that 13 of the 16 are genuine
`rerender-derived-state-no-effect` violations while 3 are legitimate one-time
external-system reads (auth token bootstrap, book reading position, ref-guarded podcast
playback restore) that should not be "fixed."

**Correction 2 — `purity` should never have stayed off.** The split shows it reports
**zero** violations. Confirmed independently at error severity:

```
$ npx eslint src --rule '{"react-hooks/purity":"error"}'   # exit 0, no output
```

It was disabled only because it shipped disabled next to `set-state-in-effect`. Leaving
a clean rule off buys nothing and lets the first future violation land silently, so it
is now `'error'`. Full `npm run lint` still exits 0 with it on.

**Lesson:** a subagent contradicting my own recorded number is a reason to re-measure,
not a reason to defend the number. The measurement is cheap; being wrong in a file
comment that future readers will trust is not.

### D14 — `generateStaticParams` rejected, not postponed

The Next.js audit flagged that none of the ~20 dynamic route segments declare
`generateStaticParams`, so every one of them renders as `ƒ (Dynamic)`. On the face
of it that reads like an easy prerendering win. It is not, and the reason is worth
recording so nobody "fixes" it later.

**What the public dynamic routes actually are.** Every one of them is a
`'use client'` shell:

```tsx
// src/app/(site)/books/[bookId]/page.tsx
'use client';
export default function Page() {
  return <SitePage><BookDetailPage /></SitePage>;
}
```

Note what is missing: the component never receives or reads `params`. The id is
read further down via `useParams()`, and the content is fetched in the browser.
The same shape holds for `courses/[courseId]`, `trips/[tripId]`,
`clinic/[clinicId]`, `encyclopedia/[entryId]`, `monograph/[monographId]` and the
three `community/*` detail routes.

**Why adding `generateStaticParams` would be actively harmful here.**

1. *It buys nothing.* The prerendered output would be an identical empty shell for
   every id, because there is no server-side data to bake in. The user still waits
   for the same client fetch. We would trade `ƒ Dynamic` for `○ Static` in the
   build table and change nothing a user can perceive.
2. *It makes the build depend on the backend.* To enumerate ids, the function has
   to call the API at build time. That API is demonstrably flaky — Phase 6 recorded
   intermittent 500s from `/api/v1/general/{contact,social-media,change-lang}`. A
   build that currently succeeds offline would start failing whenever the backend
   hiccups. That is a fragility *increase* bought with no benefit.
3. *It is the wrong half of the real fix.* `generateStaticParams` only pays off
   alongside server-side data fetching and `generateMetadata` — which is what would
   actually deliver SEO and a faster first paint for a public catalogue.

**The real modernization, and why it is postponed rather than done.** Converting
these routes to server components that fetch on the server, export
`generateMetadata`, and hand data down to a client subtree is a genuine and
worthwhile improvement. It is also a significant architectural change: the feature
components are client components that depend on `LanguageContext`, `CurrencyContext`,
`useAuth` and TanStack Query hooks, so each conversion means splitting a
server-fetching shell from a client-interactive body and re-plumbing the query
cache through `HydrationBoundary`. Per the project rule — *if a proposed
modernization could cause significant breaking changes, document it and postpone it
until safer changes are complete* — it is written up in `02-plan.md` as follow-up
work rather than attempted at the end of this pass.

**Decision:** do not add `generateStaticParams` to any route in its current
client-shell form. Revisit only as part of the server-component conversion, never
on its own.

### D15 — The `Field` primitive is dead code, and should be deleted

`src/components/ui/field.tsx` (73 lines) and `src/components/ui/field.test.tsx` (74 lines)
were written during this pass to standardise form-field accessibility: a render-prop
component that generates a `useId`-based id and hands back `{ id, 'aria-invalid',
'aria-describedby' }` to spread onto the real control.

**It ended up with zero call sites.** When Batch 4 actually did the accessibility work, the 8
files with real per-field errors were fixed in place by adding the four attributes directly.
That was the right call — reshaping those call sites into a render-prop form carried far more
visual-regression risk than adding attributes to markup that already worked, and the rule for
this pass is that appearance must not change. But it leaves a primitive that nothing uses.

**Verified dead, not merely unreferenced by static analysis** (per the Phase 8 rule):
- `Field` is a plain named export — not reachable by string, config, or convention.
- The only import of the module anywhere in the repo is its own test file.
- There is **no template-literal `import()` anywhere in `src`**, so no dynamic specifier could
  resolve to it.
- Both files are **untracked** — they were created in this pass and have never been committed,
  so nothing in the project's history depends on them.
- There is no natural adopter waiting: the only two forms using `useAppForm`
  (`health-assessment-form.tsx`, `health-assessment-page.tsx`) surface page-level status
  banners, not per-field errors.

**Recommendation: delete both files.** An abstraction with one speculative design and no
consumers is the kind of thing that gets discovered in a year and cargo-culted into use.

**Status: NOT deleted.** The deletion was attempted and refused by the sandbox's
irreversible-local-destruction guard, which is correct — untracked files cannot be recovered
from git. It needs a human to run:

```
rm src/components/ui/field.tsx src/components/ui/field.test.tsx
```

Until then the test suite reports **78 tests across 24 files**; after deletion expect
**72 across 23** (`field.test.tsx` contributes 6). Note that because the files are untracked,
a `git add -A` would commit them — so this is a decision to make before the next commit, not
after.
