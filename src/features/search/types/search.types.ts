/**
 * DTOs for the global search endpoint: GET /api/user/search (PUBLIC).
 * The backend `endpoint` field on each item is an API path, NOT a site route.
 * The frontend maps `type` -> site route via SEARCH_TYPE_ROUTES below.
 */

export interface SearchItemDto {
  type: string;
  id: number | string;
  title: string;
  description?: string;
  image?: string | null;
  /** API path (e.g. /api/v1/user/courses/1) — do NOT link to this directly. */
  endpoint?: string;
  requires_auth: boolean;
  requires_subscription: boolean;
  meta?: Record<string, unknown>;
}

export interface SearchGroupDto {
  key: string;
  label: string;
  count: number;
  items: SearchItemDto[];
}

export interface SearchResponseDto {
  query: string;
  total_results: number;
  groups: SearchGroupDto[];
}

export interface SearchGlobalParams {
  q: string;
  perGroup?: number;
}

/**
 * Maps a backend search `type` (or group `key`) to a site route builder.
 *
 * Routes were verified against `src/app` route folders. Notable deviations
 * from the integration plan's suggested paths (which pointed at
 * `/education/encyclopedia/...` — a route that does NOT exist):
 *   - encyclopedia_news -> /encyclopedia/{id}   (actual library route)
 *   - herbal_library    -> /encyclopedia/{id}   (actual library route)
 *   - plant_fungi       -> /encyclopedia/{id}   (UNCERTAIN: no dedicated
 *                          plants/fungi route exists; encyclopedia is closest)
 *   - podcast_episode   -> /podcasts            (UNCERTAIN: only a list page
 *                          exists, no /podcasts/{id} detail route)
 *   - faq               -> /faq                 (list page, no per-item route)
 */
export const SEARCH_TYPE_ROUTES: Record<string, (id: string) => string> = {
  // Courses
  courses: (id) => `/courses/${id}`,
  course: (id) => `/courses/${id}`,
  // Books
  books: (id) => `/books/${id}`,
  book: (id) => `/books/${id}`,
  // Encyclopedia news
  encyclopedia_news: (id) => `/encyclopedia/${id}`,
  // Herbal library
  herbal_library: (id) => `/encyclopedia/${id}`,
  // Plants & fungi (no dedicated route — falls back to encyclopedia)
  plants_fungi: (id) => `/encyclopedia/${id}`,
  plant_fungi: (id) => `/encyclopedia/${id}`,
  // Community: articles / blogs
  articles: (id) => `/community/blogs/${id}`,
  article: (id) => `/community/blogs/${id}`,
  // Community: theories
  theories: (id) => `/community/theories/${id}`,
  theory: (id) => `/community/theories/${id}`,
  // Community: research
  research: (id) => `/community/researches/${id}`,
  researches: (id) => `/community/researches/${id}`,
  // Clinics
  clinics: (id) => `/clinic/${id}`,
  clinic: (id) => `/clinic/${id}`,
  // Trips
  trips: (id) => `/trips/${id}`,
  trip: (id) => `/trips/${id}`,
  // Podcasts (no detail route — list page only)
  podcast: () => `/podcasts`,
  podcast_episode: () => `/podcasts`,
  // FAQ (list page only)
  faqs: () => `/faq`,
  faq: () => `/faq`,
};

/**
 * Resolves the best site route for a search item. Tries the item `type`, then
 * the group `key`, then a null fallback so callers can render a non-link card.
 */
export function resolveSearchItemRoute(item: SearchItemDto, groupKey?: string): string | null {
  const id = String(item.id);
  const builder = SEARCH_TYPE_ROUTES[item.type] ?? (groupKey ? SEARCH_TYPE_ROUTES[groupKey] : undefined);
  return builder ? builder(id) : null;
}
