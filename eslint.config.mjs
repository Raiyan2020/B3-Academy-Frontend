import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // The migration baseline contains legacy React code outside `src/`. These
    // checks remain covered by TypeScript/build while each phase modernizes it.
    rules: {
      // Re-enabled: both rules are clean across src as of this pass, verified with
      // `npx eslint src --rule '{"@typescript-eslint/no-explicit-any":"error"}'` and
      // `npx eslint src --rule '{"@typescript-eslint/no-unused-vars":[...]}'` (both
      // exit 0). 27 no-unused-vars violations (dead imports/destructures/catch
      // bindings) and 20 no-explicit-any violations (mostly untyped backend-JSON
      // mapper boundaries, replaced with real DTO/output types or a checked
      // `unknown`-narrowing helper) were fixed at their cause rather than suppressed.
      // argsIgnorePattern/varsIgnorePattern let a genuinely-unused-but-required
      // parameter be marked with a leading `_` instead of deleted.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Still off: 22 of 25 `<img>` usages were migrated to next/image. The
      // remaining 3 are intentionally left as raw `<img>` because their `src`
      // is not a fixed/allowlistable value or their real aspect ratio can't be
      // determined without risking a visual regression: image-upload.tsx
      // (previews an arbitrary/dynamic image source, incl. data: URLs),
      // BookDetailView.tsx (fixed-width/auto-height cover with unknown per-book
      // aspect ratio), and home-page.tsx (fixed-height/auto-width logo whose
      // intrinsic size couldn't be verified — the source host blocked the
      // fetch used to check it). Re-measure with
      // `npx eslint src --rule '{"@next/next/no-img-element":"error"}'` before
      // flipping this to 'error'.
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',

      // Re-enabled: the codebase is clean under this rule as of Batch 2, verified
      // with `npx eslint src --rule '{"react-hooks/rules-of-hooks":"error"}'`.
      // It was disabled while a real violation existed in settings-page.tsx
      // (an early return ahead of 20+ useState calls). Keeping it ON now prevents
      // that class of bug from returning silently.
      'react-hooks/rules-of-hooks': 'error',

      // Still off, but measured, not guessed. Re-measured against the Vercel React
      // best-practices audit (`npx eslint src --rule '{...:"warn"}'`): 16 warnings
      // today, ALL of them set-state-in-effect; `purity` reports zero.
      // Of those 16, 13 are genuine `rerender-derived-state-no-effect` violations
      // and 3 are legitimate one-time external-system reads (auth token bootstrap,
      // book reading position, ref-guarded podcast playback restore) — see
      // docs/modernization/audit-vercel-rerender-rendering.md.
      // Scheduled with the state-modelling work in docs/modernization/02-plan.md.
      // Re-enable as 'error' once that count is zero — do not raise
      // --max-warnings to accommodate them.
      'react-hooks/set-state-in-effect': 'off',
      // Re-enabled: `purity` reports zero violations across src today, verified with
      // `npx eslint src --rule '{"react-hooks/purity":"error"}'` (exit 0). It was
      // only ever off because it shipped disabled alongside the rule above; leaving
      // a clean rule disabled buys nothing and lets the next violation land silently.
      'react-hooks/purity': 'error',

      // Re-enabled: zero violations across src, verified with
      // `npx eslint src --rule '{"jsx-a11y/alt-text":"error"}'` (exit 0, no output).
      'jsx-a11y/alt-text': 'error',
    },
  },
  // `backend/` is a separate Laravel application, vendored as its own git repo and
  // already git-ignored here. Linting it with the Next.js config produced 18,380
  // problems (1,845 errors) from PHP-adjacent and bundled JS, which made
  // `npm run lint --max-warnings=0` permanently red and therefore useless as a gate.
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'migrated_prompt_history/**',
    'backend/**',
  ]),
]);
