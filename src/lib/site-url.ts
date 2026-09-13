const DEFAULT_SITE_URL = 'https://b3academy.com';

/**
 * Public site origin used for sitemap.ts / robots.ts absolute URLs.
 * NEXT_PUBLIC_API_BASE_URL points at the backend API, not the site itself,
 * so this reads a dedicated NEXT_PUBLIC_SITE_URL (see .env.example).
 */
export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
