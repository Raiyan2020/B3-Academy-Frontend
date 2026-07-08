import { ApiError, type ApiValidationErrors } from './api-error';

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

const DEFAULT_API_BASE_URL = 'http://portal.b3.raiyan.cc/';

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

function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  let normalizedPath = normalizeApiPath(path.startsWith('/') ? path : `/${path}`);
  if (/\/api\/v1$/i.test(base) && normalizedPath.startsWith('/api/v1/')) {
    normalizedPath = normalizedPath.slice('/api/v1'.length);
  }
  return `${base}${normalizedPath}`;
}

export function resolveApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return joinUrl(getBaseUrl(), path);
}

function appendQuery(url: string, query?: QueryParams) {
  if (!query) return url;
  const parsed = new URL(url);
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
  return parsed.toString();
}

function getStoredToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('b3_api_token') || undefined;
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
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Accept')) requestHeaders.set('Accept', 'application/json');
  if (!isFormData && body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(appendQuery(resolveApiUrl(path), query), {
    credentials: 'include',
    ...init,
    headers: requestHeaders,
    body: body === undefined || isFormData ? (body as BodyInit | undefined) : JSON.stringify(body),
  });
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
