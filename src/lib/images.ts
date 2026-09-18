/**
 * The site logo doubles as the fallback for every image the backend has not
 * supplied. Keeping it in one module means dropping a new file at this single
 * path re-skins every empty image on the site at once.
 */
export const LOGO_IMAGE = '/images/logo.png';

/**
 * Resolve an image URL coming from the API, falling back to the logo.
 *
 * The backend returns `null`, an absent key, or an empty string for an image it
 * does not have, and `next/image` throws on an empty `src` — so callers must
 * never pass an API value straight through.
 */
export function imageOrLogo(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : LOGO_IMAGE;
}
