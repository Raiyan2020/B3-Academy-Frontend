import { ApiError, type ApiValidationErrors } from './api-error';
// Shared constant rather than a second literal 'b3_lang': a duplicated storage key is
// exactly what caused the account-deletion PII bug (see 04-decisions.md).
import { STORAGE_KEYS } from '@/lib/storage/safe-local-storage';

type QueryValue = string | number | boolean | undefined | null;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

export interface ApiEnvelope<T> {
  key?: string;
  msg?: string;
  message?: string;
  data?: T;
  errors?: ApiValidationErrors;
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: QueryParams;
}

const DEFAULT_API_BASE_URL = 'https://portal.b3.raiyan.cc/';

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
}

function normalizeApiPath(path: string) {
  if (path.startsWith('/api/v1/')) return path;
  if (path.startsWith('/api/user/')) return path.replace('/api/user/', '/api/v1/user/');
  if (path === '/api/user') return '/api/v1/user';
  if (path.startsWith('/api/general/')) return path.replace('/api/general/', '/api/v1/general/');
  if (path === '/api/general') return '/api/v1/general';
  return path;
}

// Hoisted to module scope: both patterns are static, and these run on every API
// request. Per the spec each evaluation of a regex literal creates a new RegExp.
// (vercel-react-best-practices: js-hoist-regexp)
const API_V1_SUFFIX_PATTERN = /\/api\/v1$/i;
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  let normalizedPath = normalizeApiPath(path.startsWith('/') ? path : `/${path}`);
  if (API_V1_SUFFIX_PATTERN.test(base) && normalizedPath.startsWith('/api/v1/')) {
    normalizedPath = normalizedPath.slice('/api/v1'.length);
  }
  return `${base}${normalizedPath}`;
}

export function resolveApiUrl(path: string) {
  if (ABSOLUTE_URL_PATTERN.test(path)) return path;
  return joinUrl(getBaseUrl(), path);
}

/**
 * The origin of the API, for connection warm-up in the root layout.
 * Returns `undefined` rather than throwing if the configured base URL is
 * relative or malformed — the caller is the root layout, so a throw here would
 * take down every route to save one RTT.
 */
export function getApiOrigin(): string | undefined {
  const base = getBaseUrl();
  if (!ABSOLUTE_URL_PATTERN.test(base)) return undefined;
  try {
    return new URL(base).origin;
  } catch {
    return undefined;
  }
}

function appendQuery(url: string, query?: QueryParams) {
  if (!query) return url;
  const isRelative = url.startsWith('/');
  const parsed = new URL(url, isRelative ? 'http://localhost' : undefined);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') parsed.searchParams.append(key, String(item));
      });
      return;
    }
    parsed.searchParams.set(key, String(value));
  });
  return isRelative ? `${parsed.pathname}${parsed.search}` : parsed.toString();
}

function getStoredToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('b3_api_token') || undefined;
}

// The backend localizes responses from the Accept-Language header (SetLocaleFromHeader
// middleware, defaulting to 'en'). Mirror the user's selected UI language (persisted by
// LanguageContext under STORAGE_KEYS.language) so API content matches the site language.
//
// The `|| DEFAULT_UI_LANGUAGE` fallback is load-bearing, not defensive padding. It fixes a
// real race: LanguageProvider writes that key from a *mount effect*, and React runs effects
// child-first, so a page's data fetches can go out BEFORE the write lands. This function
// previously returned `undefined` in that window, the header was omitted, and the backend
// answered in its own default ('en') — on a site whose <html lang> is hardcoded "ar".
//
// Measured on /books, 3/3 runs each, fresh browser profile: the request went out with no
// Accept-Language and rendered English book titles, purely because of effect ordering.
// Unrelated timing changes elsewhere (a dynamic import, a memoised provider) flipped it to
// Arabic — which is how it was found. Content language must not depend on effect ordering.
//
// Must stay in sync with LanguageContext's own default.
const DEFAULT_UI_LANGUAGE = 'ar';

function getStoredLanguage() {
  // On the server there is no user preference to read, so fall back to the app default
  // rather than omitting the header. Returning undefined here (as this did originally,
  // deferred as an owner decision in the prerender-language note in
  // docs/modernization/01-audit.md) is not merely a first-paint flash:
  //
  // `/books` prefetches its catalogue on the server and ships it through a
  // HydrationBoundary. With no Accept-Language the backend answers in its own default
  // ('en'), React Query hydrates that English payload, and the client never refetches —
  // so the whole digital library renders **permanently** in English inside a document
  // that declares lang="ar" dir="rtl". Confirmed in the browser: category filters
  // ("Self Development", "Mental Health") and every book title stayed English after
  // hydration settled, with zero book requests issued from the browser.
  //
  // Sending the default makes the prerender match both the declared document language
  // and what the user ends up seeing.
  if (typeof window === 'undefined') return DEFAULT_UI_LANGUAGE;
  return window.localStorage.getItem(STORAGE_KEYS.language) || DEFAULT_UI_LANGUAGE;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function resolveMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const envelope = payload as ApiEnvelope<unknown>;
    return envelope.msg || envelope.message || fallback;
  }
  return fallback;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, query, headers, ...init } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const token = getStoredToken();
  const language = getStoredLanguage();
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Accept')) requestHeaders.set('Accept', 'application/json');
  if (language && !requestHeaders.has('Accept-Language')) {
    requestHeaders.set('Accept-Language', language);
  }
  if (!isFormData && body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(appendQuery(resolveApiUrl(path), query), {
      credentials: 'omit',
      ...init,
      headers: requestHeaders,
      body: body === undefined || isFormData ? (body as BodyInit | undefined) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError({
      status: 0,
      key: 'network_error',
      message: 'Unable to connect to the service. Please try again.',
    });
  }
  const payload = await parseResponse(response);

  if (!response.ok) {
    const envelope = payload && typeof payload === 'object' ? (payload as ApiEnvelope<unknown>) : undefined;
    throw new ApiError({
      status: response.status,
      key: envelope?.key,
      message: resolveMessage(payload, response.statusText || 'Request failed.'),
      errors: envelope?.errors,
    });
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
}
