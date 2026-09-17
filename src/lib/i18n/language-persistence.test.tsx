import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/LanguageContext';
import { STORAGE_KEYS } from '@/lib/storage/safe-local-storage';

// The backend language sync is a side effect of switching language; it is not what these
// tests are about, and letting it hit the network makes them slow and flaky.
vi.mock('@/features/i18n/services/language-api.service', () => ({
  changeBackendLanguage: vi.fn().mockResolvedValue(undefined),
}));

function Probe() {
  const { language, dir } = useLanguage();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="dir">{dir}</span>
    </div>
  );
}

describe('language preference persistence', () => {
  it('does not overwrite a saved non-Arabic preference while its locale chunk loads', async () => {
    // A returning English visitor. Restoring this is asynchronous — it waits on the `en`
    // locale chunk — so on mount the provider still renders the Arabic default for a moment.
    window.localStorage.setItem(STORAGE_KEYS.language, 'en');

    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    // Immediately after mount, before the chunk has resolved, the rendered language is
    // still 'ar'. Storage must NOT have been rewritten to match it: persisting the
    // *rendered* language here destroyed the user's actual choice.
    expect(window.localStorage.getItem(STORAGE_KEYS.language)).toBe('en');

    // Once the chunk resolves the UI catches up, and storage still agrees. This needs a
    // real retry rather than a flushed microtask — the locale arrives via `import()`.
    await waitFor(() => expect(screen.getByTestId('language')).toHaveTextContent('en'));
    expect(screen.getByTestId('dir')).toHaveTextContent('ltr');
    expect(window.localStorage.getItem(STORAGE_KEYS.language)).toBe('en');
  });

  it('writes the preference when the user actually chooses a language', async () => {
    function Switcher() {
      const { setLanguage, language } = useLanguage();
      return (
        <button onClick={() => setLanguage('en')} data-testid="switch">
          {language}
        </button>
      );
    }

    render(
      <LanguageProvider>
        <Switcher />
      </LanguageProvider>,
    );

    expect(window.localStorage.getItem(STORAGE_KEYS.language)).toBeNull();

    await act(async () => {
      screen.getByTestId('switch').click();
    });

    expect(window.localStorage.getItem(STORAGE_KEYS.language)).toBe('en');
  });

  it('leaves a first-time visitor with no stored language, so the API default applies', () => {
    // base-fetch falls back to 'ar' when this key is absent (see base-fetch.test.ts).
    // Writing 'ar' here on mount would be harmless but redundant; what matters is that
    // an absent key is a valid, expected state rather than something to "fix" on mount.
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('language')).toHaveTextContent('ar');
    expect(screen.getByTestId('dir')).toHaveTextContent('rtl');
  });
});
