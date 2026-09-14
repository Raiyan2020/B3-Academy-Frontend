# B3 Academy — Agent & Developer Guide

Canonical conventions for humans and coding agents working in this repo.

## Layout

| Path | Purpose |
| ---- | ------- |
| `src/app/` | Next.js App Router routes only — keep pages thin |
| `src/features/[name]/` | Feature UI, hooks, services, types |
| `src/components/ui/` | Shared UI primitives (button, input, dialog, …) |
| `src/components/public/` | Shared public-site building blocks |
| `src/components/feedback/` | Toasts, confirm dialogs, field errors |
| `src/lib/` | Cross-cutting helpers (query, forms, motion, storage) |

**Note:** Feature code lives under `src/features/`, not root `features/`.

## Stack

- Next.js App Router · React 19 · TypeScript · Tailwind CSS v4
- `@tanstack/react-query` — data fetching & cache
- `react-hook-form` + `zod` — forms
- `sonner` — toasts (no inline success/error banners for actions)
- `motion` (`motion/react`) — animations
- Radix UI — accessible dialogs, tabs, dropdowns
- Lucide React — icons (`size` prop preferred)

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
```

Run `npm run lint` after TypeScript, forms, shared UI, data contracts, or route changes.

## Forms & feedback

- Field validation errors → under the exact input (`FormFieldError`)
- API / save errors → `ErrorAlert` / `toastError`
- Save success → `SuccessToast` / `toastSuccess`
- Mutation buttons → disabled + spinner while pending (`SubmitButton`)
- Confirm dialogs → disable confirm + loading label while in flight
- Dashboard images → `@/components/ui/image-upload` (no raw `accept="image/*"`)

## Data fetching

- Global query/mutation errors toast via `QueryClient` caches
- Each feature owns `query-keys.ts` — never inline string arrays
- Server pages prefetch with `prefetchQuery` + `HydrationBoundary`
- Services live in `features/[name]/services/` as `export async function` or `export function`

## i18n (deferred)

Translation hardcoding cleanup and RTL sweeps are **not** in the current engineering rollout. Use existing `LanguageContext` / `translateMessage` patterns when touching localized files. See `.cursor/rules/i18n.mdc` when i18n work starts.

## Cursor tooling

- Rules: `.cursor/rules/`
- Skills: `.cursor/*.md`
- MCP: `.cursor/mcp.json` (shadcn, next-devtools)
- Engineering rollout plan: `CURSOR_RULES_IMPLEMENTATION_PLAN.md`
- Business alignment plan: `DETAILED_FRONTEND_BUSINESS_ALIGNMENT_IMPLEMENTATION_PLAN.md`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
