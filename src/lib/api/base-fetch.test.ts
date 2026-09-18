import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, getApiOrigin, resolveApiUrl } from './base-fetch';
import { STORAGE_KEYS } from '@/lib/storage/safe-local-storage';

function apiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ key: 'success', data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sentHeaders(fetchMock: ReturnType<typeof vi.fn>) {
  return (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers as Headers;
}

describe('apiFetch request language', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(apiResponse({ ok: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // The regression this guards against: LanguageProvider writes the language key from a
  // mount effect, and React runs effects child-first, so a page's first data fetches can
  // go out BEFORE that write lands. When this function returned undefined in that window
  // the header was omitted and the backend replied in its own default ('en') — on a site
  // whose <html lang> is hardcoded "ar". Measured on /books: 3/3 runs rendered English
  // titles for exactly this reason. Content language must not depend on effect ordering.
  it('sends the default language when nothing is stored yet', async () => {
    await apiFetch('/api/v1/general/books');
    expect(sentHeaders(fetchMock).get('Accept-Language')).toBe('ar');
  });

  it('sends the stored language once the user has chosen one', async () => {
    window.localStorage.setItem(STORAGE_KEYS.language, 'en');
    await apiFetch('/api/v1/general/books');
    expect(sentHeaders(fetchMock).get('Accept-Language')).toBe('en');
  });

  it('reads the language through the shared storage key, not a duplicated literal', () => {
    // A second hardcoded 'b3_lang' is the defect class that let payment PII survive
    // account deletion, so pin the key the rest of the app actually writes.
    expect(STORAGE_KEYS.language).toBe('b3_lang');
  });

  // Server-side rendering has no localStorage to read. Omitting the header there made
  // the backend answer in English, and because /books hydrates that server payload into
  // React Query and never refetches, the catalogue stayed English permanently on an
  // lang="ar" page. Pin that the header is sent even with no window.
  it('sends the default language when rendering on the server', async () => {
    const window_ = globalThis.window;
    Reflect.deleteProperty(globalThis, 'window');
    try {
      await apiFetch('/api/v1/general/books');
      expect(sentHeaders(fetchMock).get('Accept-Language')).toBe('ar');
    } finally {
      globalThis.window = window_;
    }
  });

  it('does not override an explicitly supplied Accept-Language', async () => {
    await apiFetch('/api/v1/general/books', { headers: { 'Accept-Language': 'fr' } });
    expect(sentHeaders(fetchMock).get('Accept-Language')).toBe('fr');
  });
});

describe('getApiOrigin', () => {
  // This is called from the root layout, so it must never throw: a bad env value would
  // take down every route to save one connection round trip.
  it('returns the origin of an absolute base URL', () => {
    expect(getApiOrigin()).toMatch(/^https?:\/\/[^/]+$/);
  });

  it('resolves relative paths against the configured base', () => {
    expect(resolveApiUrl('/api/v1/general/books')).toContain('/api/v1/general/books');
  });

  it('leaves absolute URLs untouched', () => {
    expect(resolveApiUrl('https://example.test/thing')).toBe('https://example.test/thing');
  });
});
