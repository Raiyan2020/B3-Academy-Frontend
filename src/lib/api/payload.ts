/**
 * Narrowing helpers for untyped backend payloads.
 *
 * Nine feature services each carried their own copy of these, and the copies had
 * quietly drifted: some `asArray` implementations guarded against a null payload
 * and some did not, `toNumber` existed in two different signatures, and only the
 * trips copy knew that a paginated envelope can also carry `pagination`. The
 * versions here are the union of those behaviours — the most defensive of each.
 */

export type ApiObject = Record<string, unknown>;

export interface Paginated<T> {
  items?: T[];
  data?: T[];
  pagination?: ApiObject;
  meta?: ApiObject;
}

/** Narrows an unknown backend value to a plain object, defaulting to `{}`. */
export function asObject(value: unknown): ApiObject {
  return value && typeof value === 'object' ? (value as ApiObject) : {};
}

/** Narrows an unknown backend value to a plain object, or `null` if it isn't one. */
export function asObjectOrNull(value: unknown): ApiObject | null {
  return value && typeof value === 'object' ? (value as ApiObject) : null;
}

/** Narrows an unknown backend value (array, or `{items|data: []}` envelope) to an object array. */
export function asObjectArray(value: unknown): ApiObject[] {
  if (Array.isArray(value)) return value as ApiObject[];
  const obj = asObject(value);
  if (Array.isArray(obj.items)) return obj.items as ApiObject[];
  if (Array.isArray(obj.data)) return obj.data as ApiObject[];
  return [];
}

/** Unwraps a list that may arrive bare or inside a paginated envelope. */
export function asArray<T>(payload: T[] | Paginated<T> | undefined | null): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || [];
}

/** Tolerates plain localized strings (backend default) and legacy {ar,en} objects. */
export function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const localized = value as Record<string, unknown>;
    return String(localized.ar || localized.en || localized.name || localized.title || fallback);
  }
  return fallback;
}

export function nullableText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function toNumber(value: unknown, fallback = 0): number {
  const amount = Number(value ?? fallback);
  return Number.isFinite(amount) ? amount : fallback;
}

export function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
