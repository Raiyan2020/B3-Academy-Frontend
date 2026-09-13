# Audit — Hardening (config hygiene, untrusted content, route protection, deps)

Performed directly by the orchestrating agent (the delegated subagent runs for this
section were repeatedly blocked by an upstream content filter). All claims below were
verified by reading the actual files; commands and their real output are cited.

**No secret values appear in this document — variable names, key names and file
paths only.**

## Summary

This area is in far better shape than the rest of the audit would suggest, with
**one genuine authorization defect**. Config hygiene is nearly spotless: exactly one
environment variable exists, and it is correctly public. The single
`dangerouslySetInnerHTML` site is properly sanitized. The real problems are (a) the
`b3_session` cookie being a self-assignable role string, and (b) 10 high-severity
transitive advisories with a one-command fix.

An important correction to a parallel audit: the data-fetching audit stated *"no
middleware.ts exists to read a server-side credential."* **That is wrong** —
`src/middleware.ts` exists and does gate routes server-side. The real problem is not
its absence but what it trusts. See HARD-001.

---

## Findings

```
Issue:               `b3_session` cookie is a client-writable role string, and middleware trusts it verbatim
Location:            src/middleware.ts:6-21, src/features/auth/auth-storage.service.ts:120
Severity:            P1
Why it matters:      The middleware's `/admin` and `/doctor` gates are the app's only
                     server-side authorization check, and the value they check is set
                     by the browser itself. Anyone can run
                     `document.cookie = 'b3_session=ADMIN'` in a console and walk
                     straight past both gates. The cookie is written with
                     `document.cookie` (so it is not httpOnly, not Secure, and not
                     signed) and its value IS the role, not a reference to a
                     server-verified session.
Current behavior:    auth-storage.service.ts:120 —
                       document.cookie = `b3_session=${user.role}; path=/; max-age=604800; SameSite=Lax`
                     middleware.ts:11 —
                       if (!session || session !== 'ADMIN') redirect('/auth')
                     No signature, no server lookup, no expiry validation.
Recommended solution: Stop deriving authorization from a client-set value. Either
                     (a) have the Laravel API set an httpOnly, Secure, SameSite
                     session cookie at login and have middleware validate it against
                     the API (or verify a signed token), or (b) keep the cookie only
                     as a routing hint and treat every `(admin)`/`(doctor)` page's
                     data as untrusted until the backend authorizes the request.
                     (a) is the correct fix; (b) is the minimum.
Risk:                Medium — touches the login/logout path and every protected
                     route. Must be done with the backend, not unilaterally.
Verification method: Set the cookie manually in a browser and confirm `/admin/users`
                     no longer renders; confirm login/logout still work end to end;
                     confirm the API rejects an unauthorized admin call.
Status:              Open
```

**Scope note, stated precisely so this is neither under- nor over-sold:** bypassing
this cookie yields the admin *UI shell*, not admin data. Every API call carries the
bearer token from `localStorage`, and the Laravel backend authorizes each request
independently. So this is a defence-in-depth failure and an information-disclosure
risk around admin UI structure — **not**, on its own, proof that admin data is
reachable.

### Follow-up investigation — the role does not exist server-side at all

An automated security review independently flagged this same code as CRITICAL and
recommended verifying a signed JWT instead. Investigating that recommendation
uncovered something more fundamental, verified by reading the files:

- `backend/app/Http/Resources/UserResource.php` returns exactly
  `id`, `name`, `email`, `phone`, `country_code`, `image`, `is_active`, `is_blocked`,
  `is_notifiable`, `has_active_subscription`, `token`. **There is no role field.**
- `src/features/auth/services/auth-api.service.ts:38-50` — the `BackendUser`
  interface has no role either, and `mapBackendUser` at line 67 **hardcodes
  `role: UserRole.STUDENT`** for every user returned by the API.

Consequences, and they change the shape of this finding:

1. **A legitimate backend login can never produce an ADMIN or DOCTOR role.** Every
   API-authenticated user is mapped to `STUDENT`, so `b3_session` is always
   `STUDENT` on that path. The only way to reach `/admin` or `/doctor` is to set the
   cookie by hand or to go through the legacy local-accounts path in
   `auth-storage.service.ts`.
2. **The role gate is not protecting a server-authenticated privilege — it is
   protecting a value the frontend invented.** The Laravel API's `user` guard models
   end-users only; the real admin surface is the backend's own Blade dashboard
   (`backend/resources/views/dashboard/**`), behind a different guard entirely.
3. **The recommended JWT fix cannot be implemented as written.** Signing the cookie
   would put a cryptographic signature over a role the frontend fabricated. That is
   security theater, not a fix — it would make the code *look* verified while
   changing nothing about who can reach the admin UI. Correctly rejected.

So the fix genuinely does require a backend change, but for a more basic reason than
"the API should set the cookie": **the API must first expose an authenticated user's
role at all.** Until it does, there is nothing trustworthy for the frontend to check.

**Mitigation applied now:** `src/proxy.ts` carries an explicit comment stating that it
is not an authorization boundary, that every value read there is attacker-controlled,
why a signed token is not the fix, and where the real fix is tracked. This prevents
the far more likely future failure — a developer reading `session !== 'ADMIN'`,
believing admin routes are protected, and putting genuinely sensitive data behind it.

```
Issue:               10 high-severity transitive advisories (undici, ws)
Location:            node_modules/undici, node_modules/ws (transitive, not direct deps)
Severity:            P1
Why it matters:      `npm audit` reports 12 vulnerabilities (2 moderate, 10 high).
                     undici: response desynchronization via retry interceptor,
                     cross-user information disclosure via cache-control parsing,
                     CRLF injection via blob body `type`, cookie attribute injection.
                     ws: uninitialized memory disclosure, memory-exhaustion DoS.
Current behavior:    Present in the installed tree; `npm audit fix` reports a fix is
                     available for all of them without a major-version bump.
Recommended solution: Run `npm audit fix` (non-breaking by npm's own classification),
                     then re-run typecheck + tests + build to confirm nothing moved.
                     Do NOT use `--force`.
Risk:                Low — transitive patch/minor bumps only. Verifiable immediately.
Verification method: `npm audit` returns 0 high; typecheck/test/build all still pass.
Status:              Open
```

```
Issue:               Three unused runtime dependencies, one of them large
Location:            package.json — `@google/genai`, `jspdf`, `react-markdown`
Severity:            P2
Why it matters:      Dead dependencies inflate install time and the audit surface,
                     and `@google/genai` in particular implies an AI integration that
                     does not exist, which misleads future readers. Verified zero
                     importers across every `.ts`/`.tsx` in the repo (excluding
                     `backend/` and `node_modules/`) using ripgrep.
Current behavior:    `src/app/api/ai/chat/route.ts` is a stub that returns a fixed
                     string and imports nothing; no file imports `@google/genai`,
                     `jspdf`, or `react-markdown`.
Recommended solution: Remove all three from package.json. Keep the stub route (it is
                     referenced by the on-page assistant widget contract) or delete
                     it deliberately — but do not leave the SDK installed for it.
Risk:                Low, but must be verified by a clean build, since a dynamic or
                     string-built import would not show up in a static grep.
Verification method: Remove, `npm install`, then typecheck + test + build; grep once
                     more for dynamic `import(` with these names.
Status:              Open
```

```
Issue:               Three redundant direct @radix-ui/* dependencies
Location:            package.json — `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`
Severity:            P3
Why it matters:      The project imports Radix two different ways, and these three are
                     never imported directly, so they duplicate what the `radix-ui`
                     meta package already provides — a classic route to two copies of
                     the same primitive in one bundle.
Current behavior:    Actual imports, verified with ripgrep across `src/`:
                       - `radix-ui` (meta): src/components/ui/{scroll-area,popover,dialog}.tsx
                       - `@radix-ui/react-slot`: src/components/ui/button.tsx
                     `@radix-ui/react-{dialog,dropdown-menu,tabs}`: zero direct imports.
Recommended solution: Drop the three unused direct deps and keep `radix-ui` +
                     `@radix-ui/react-slot`. Standardize on the meta package.
Risk:                Low. Verify `npm ls @radix-ui/react-dialog` afterwards to confirm
                     it is still present transitively via `radix-ui` as expected.
Verification method: Build passes; dialogs/popovers/scroll areas still render and
                     behave identically.
Status:              Open
```

```
Issue:               `.env` is tracked by git
Location:            .env (tracked), .gitignore (ignores only `.env*.local`)
Severity:            P3
Why it matters:      Convention violation that will eventually cause a real leak — the
                     moment anyone adds a private value to this already-tracked file,
                     it is committed by default.
Current behavior:    `git ls-files` lists both `.env` and `.env.example`.
                     **Nothing is currently exposed:** the only key in `.env` is
                     `NEXT_PUBLIC_API_BASE_URL`, and `cmp -s .env .env.example`
                     reports the two files are byte-identical, so `.env` holds no
                     private value at all. Verified without printing any value.
Recommended solution: `git rm --cached .env` and add `.env` to `.gitignore`, keeping
                     `.env.example` tracked. Since `.env` is identical to the example
                     and holds no secret, no history rewrite and no credential
                     rotation is needed.
Risk:                Very low. Contributors must copy `.env.example` to `.env`, which
                     is already the implied workflow.
Verification method: `git ls-files | grep '\.env'` lists only `.env.example`; a fresh
                     clone plus `cp .env.example .env` still builds and runs.
Status:              Open
```

```
Issue:               Bearer token in localStorage (recorded here; owned by the data-fetching audit)
Location:            src/lib/api/base-fetch.ts:67, src/features/auth/services/auth-api.service.ts:80-88
Severity:            P2
Why it matters:      A token in `localStorage` is readable by any script on the origin,
                     and cannot be sent during SSR/RSC — which is what blocks the
                     server-prefetch pattern `AGENTS.md` mandates. The httpOnly-cookie
                     fix for HARD-001 would resolve both problems at once, so the two
                     should be planned together rather than separately.
Current behavior:    Key `b3_api_token` written/read via `window.localStorage`.
Recommended solution: Fold into the HARD-001 session redesign — an httpOnly cookie set
                     by the API serves both authorization and SSR credential needs.
Risk:                Medium; same blast radius as HARD-001.
Verification method: As HARD-001, plus an authenticated server-prefetched route
                     rendering with data on first paint.
Status:              Open — track with HARD-001
```

---

## Account-deletion data erasure — one bug fixed, a scope gap left open

Found by auditing against `vercel-react-best-practices` rule
`client-localstorage-schema`, and independently verified by me. This is the clearest
argument for having loaded that skill: the rule is nominally about localStorage
hygiene, and it surfaced a live privacy bug that six earlier first-principles audits
all missed.

```
Issue:               Account-deletion anonymization targeted a key nothing ever wrote,
                     so payment PII survived account deletion
Location:            src/features/auth/auth-provider.tsx:256
Severity:            P1 (privacy / data-erasure correctness)
Why it matters:      `deleteAccount()` is the app's data-erasure path. Step 2 is meant
                     to anonymize payment records while preserving financial totals.
                     It read the key `'b3-payments-records'` (plural "payments"), but
                     the payments store writes `'b3-payment-records'` (singular) —
                     `payments-storage.service.ts:8`. So the step read an empty array,
                     mapped over nothing, and wrote an empty array back. It silently
                     no-opped, leaving `userId` and `userName` in place. (Corrected: an earlier
                      version of this entry also listed invoice `userName`/`userEmail`.
                      InvoiceRecord has no such fields — see the note below.)
Current behavior:    FIXED. Verified: `'b3-payments-records'` appeared in exactly one
                     place in the entire codebase — this erasure block — confirming it
                     was a phantom key. The other 11 keys in the block were each
                     checked against their owning service and all match correctly.
Recommended solution: Applied — key corrected, with a comment tying it to the owning
                     service. The root cause is unaddressed though: every key in this
                     block is a local string literal, so nothing prevents the next
                     drift. A shared key registry (one exported const per key,
                     imported by both the store and the erasure path) would make this
                     class of bug impossible. Recommended, not done — it touches ~45
                     keys across many services.
Risk:                The fix itself is one string. It does mean the step now actually
                     mutates data, which it never did before — intended, but it is a
                     real behaviour change on a destructive path.
Verification method:  typecheck 0 · lint exit 0 · 68/68 tests · build passes. A proper
                     check would be a test asserting that after `deleteAccount()` no
                     record under the payments key retains the deleted user's id.
Status:              FIXED (root cause open)
```

```
Issue:               Nine more user-data keys are never touched by account deletion
Location:            src/features/auth/auth-provider.tsx:240-340 (deleteAccount)
Severity:            P1 — but needs a product/legal decision, not a unilateral fix
Why it matters:      The erasure path handles 12 keys. Enumerating every `b3-*` key
                     written anywhere in `src/` and diffing against that list shows
                     nine holding user-identifiable data that deletion ignores entirely:
                       - b3-payment-intents            (payment data)
                       - b3-consultation-chat-messages (medical conversations)
                       - b3-community-chat-messages    (user messages)
                       - b3-print-orders              (likely name/address)
                       - b3-subscription-history       (billing history)
                       - b3-care-package-session-records
                       - b3-cooperation-requests
                       - b3-book-reading-positions
                       - b3-podcast-playback
                     Consultation chat messages are the most sensitive of these.
Current behavior:    Retained indefinitely after the user deletes their account.
Recommended solution: Decide per key whether it should be deleted outright or
                     anonymized like payments (the existing code already distinguishes
                     the two: health assessments are deleted, payments anonymized to
                     preserve financial totals). That mapping is a data-retention
                     decision with legal implications — which is why it is documented
                     here rather than guessed at and implemented.
Risk:                Implementing without a decision risks either destroying records
                     the business must retain, or retaining data it must not.
Verification method: After the mapping is agreed: a test that seeds every key with a
                     record for a user, runs `deleteAccount()`, and asserts each key
                     reaches its intended state.
Status:              Open — needs owner decision
```

## Areas verified clean

- **Environment variables.** Exactly one is referenced anywhere in the app:
  `NEXT_PUBLIC_API_BASE_URL`. Its `NEXT_PUBLIC_` prefix is correct — it is a public
  API base URL and is meant to reach the browser. No secret is read in any client
  component, because no other variable exists to read.
- **Untrusted HTML.** Exactly one `dangerouslySetInnerHTML` in the codebase, at
  `src/components/ui/rich-text.tsx:20`, and its input is sanitized on the line above
  by `DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })` — an explicit safe
  profile, not a bare pass-through. This is the correct pattern.
- **Markdown.** `react-markdown` is not imported anywhere, so there is no
  `rehype-raw` / `allowDangerousHtml` escape hatch in play.
- **AI route handler.** `src/app/api/ai/chat/route.ts` is a 10-line stub returning a
  constant string. It reads no request body, holds no key, and instantiates no SDK,
  so it presents no injection or key-exposure surface. (It also has no body
  validation or rate limiting — which is fine *only* while it stays a stub. If it is
  ever wired to a real model, both become required.)
- **Redirects.** The only redirects are in `src/middleware.ts`, and every target is a
  hardcoded internal literal (`/auth`, `/dashboard`, `/admin/users`, `/doctor`) built
  with `new URL(..., request.url)`. No request input flows into a redirect target, so
  there is no open-redirect surface.
- **Middleware matcher.** `'/((?!api|_next/static|_next/image|favicon.ico).*)'`
  correctly excludes static and image-optimizer paths.

## Route protection coverage

Derived from `src/middleware.ts`. "Server-side" here means the check runs in
middleware, before any markup is produced.

| Route group | Server-side check | Mechanism | Trustworthy? |
| --- | --- | --- | --- |
| `(admin)` `/admin/**` | Yes | `b3_session === 'ADMIN'` | **No** — client-settable value (HARD-001) |
| `(doctor)` `/doctor/**` | Yes | `b3_session === 'DOCTOR'` | **No** — client-settable value (HARD-001) |
| `(account)` `/dashboard`, `/settings`, `/clinic-booking`, `/consultation`, `/health-assessment`, `/rate-us` | Yes | cookie presence only | Presence-only, but adequate for "is signed in" |
| `(checkout)` `/checkout/**` | Yes | cookie presence only | Presence-only |
| `(learn)` `/learn/`, `/read/` | Yes | cookie presence only | Presence-only |
| `(library)` `/monograph` | Yes | cookie presence only | Presence-only |
| `(community)` `/community/chat`, `/community/researches` | Yes | cookie presence only | Presence-only |
| `(community)` all other paths | No | public by design | n/a |
| `(site)`, `(auth)` | No | public by design | n/a |

`(auth)` additionally redirects already-signed-in users to a role-appropriate landing
page, using the same untrusted cookie value to choose the destination — a usability
concern rather than a security one, since the destination is itself gated.

**Role source.** Roles come from `user.role` in client-persisted auth state, written
into the cookie at login. They are not re-derived from the server per request. This
is the root cause behind HARD-001.

## Dependency health

`npm audit`: **12 vulnerabilities — 2 moderate, 10 high.** All transitive
(`undici`, `ws`); no direct dependency is flagged. `npm audit fix` resolves them
without `--force`.

Unused / redundant declared dependencies, all verified by ripgrep across every
`.ts`/`.tsx` outside `backend/` and `node_modules/`:

| Package | Direct importers | Verdict |
| --- | --- | --- |
| `@google/genai` | 0 | REMOVE |
| `jspdf` | 0 | REMOVE |
| `react-markdown` | 0 | REMOVE |
| `@radix-ui/react-dialog` | 0 | REMOVE (covered by `radix-ui`) |
| `@radix-ui/react-dropdown-menu` | 0 | REMOVE (covered by `radix-ui`) |
| `@radix-ui/react-tabs` | 0 | REMOVE (covered by `radix-ui`) |
| `radix-ui` | 3 | KEEP |
| `@radix-ui/react-slot` | 1 | KEEP |
| `cmdk` | 1 | KEEP |
| `input-otp` | 2 | KEEP |
| `isomorphic-dompurify` | 1 | KEEP |

*Methodology caveat:* an earlier pass using single-quoted grep patterns reported
`radix-ui` as having zero importers. That was a false negative — those three files use
double-quoted import specifiers. The table above comes from a quote-agnostic ripgrep
search. Any dependency removal must still be confirmed by a clean build, since static
search cannot see a dynamically constructed import.

---

## HARD-004 — A failed newsletter API call silently degrades into a fake confirmation

```
Issue:                When the backend newsletter query errors, the page falls back to a
                      client-side mock in which typing the hardcoded literal '123456'
                      writes a "confirmed" newsletter subscription into localStorage. The
                      backend never learns of it, and the user is told it succeeded.
Location:             src/features/account/components/account-sections/newsletter-page.tsx:25
                      (the gate), :94 (the '123456' comparison), :105 (the message that
                      tells the user to use it), and the same fallback shape at :64, :115, :131
Severity:             P1
```

**Mechanism, traced rather than guessed.** The gate is:

```ts
const hasBackendNewsletter = backendNewsletter.isFetched && !backendNewsletter.isError;
```

and `useBackendNewsletter` (`src/features/account/hooks/use-account-api.ts:77-84`) is
`enabled: hasBackendToken(), retry: 1`. So `hasBackendNewsletter` goes false in two
different situations that the page then treats identically:

1. **Not fetched yet** — including the window before the auth token is read from storage,
   when the query is still disabled. A legitimate transient.
2. **Errored** — a 4xx/5xx, a network failure, or a CORS problem, after one retry.

In *both* cases every handler takes the mock branch. In case 2 that is a silent
downgrade from the real API to a local simulation, and `handleVerify` then accepts a
constant as a valid verification code and reports success.

**Why it matters beyond the test code.** The user is shown *"Your newsletter subscription
has been confirmed successfully!"* and the local status becomes `confirmed`, so the UI
stops offering to subscribe — while the backend has no subscription. The failure is
invisible to the user and to the operator. The hardcoded code is the visible symptom; the
silent API-failure fallback is the actual defect.

**Recommended solution.** Distinguish the two states instead of collapsing them: render a
loading state while `isPending`/disabled, render the existing (currently
consumer-less) `RetryPanel` on `isError`, and delete the mock branches so the localStorage
newsletter service is no longer a shadow source of truth for a server-owned resource.

**Not shipped in this pass, deliberately.** Two reasons, both stated so the omission is
not mistaken for an oversight:

- It is a **behaviour change to a subscription flow**, and the page is behind
  authentication, so it cannot be browser-verified here — the plan's own loop requires a
  BROWSER VERIFY step, and credentials are one of the conditions the brief names as a
  legitimate stop.
- Removing the fallback without splitting `isPending` from `isError` would break the
  subscribe flow during the normal auth-bootstrap window.

**Related but distinct — the same literal in dead code.** The identical `'123456'`
fallback also exists in `src/features/account/components/settings-page.tsx:84,89,315`, for
an *email change*. That file is **confirmed dead**: zero importers, no dynamic import,
no barrel, `/settings` is a bare redirect to `/dashboard/profile`, and strings unique to
it appear in no built chunk while the equivalent live string from the newsletter page
does. It therefore ships zero bytes and is not exploitable today. It has been annotated
in place with a `⚠ DO NOT WIRE THIS UP AS-IS` header rather than deleted, because whether
it is abandoned or pending-wiring is an ownership decision — but wiring it up unchanged
would ship an email change confirmed by a constant.
