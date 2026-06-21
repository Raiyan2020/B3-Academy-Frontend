export const STORAGE_KEYS = {
  user: 'b3_user',
  language: 'b3_lang',
  currency: 'b3_currency',
  blogs: 'b3_blogs_v2',
  researches: 'b3_researches_v3',
  theories: 'b3_theories_v2',
  courseComments: 'b3_course_comments',
  reviews: 'b3_academy_reviews',
  monographFavorites: 'monograph_favorites',
  newsletterDismissed: 'b3_newsletter_dismissed',
} as const;

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export function getLocalStorageItem(key: string): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setLocalStorageItem(key: string, value: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing or quota edge cases.
  }
}

export function removeLocalStorageItem(key: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures in the demo shell.
  }
}

export function readLocalStorageJson<T>(key: string, fallback: T): T {
  const raw = getLocalStorageItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLocalStorageJson<T>(key: string, value: T) {
  setLocalStorageItem(key, JSON.stringify(value));
}
