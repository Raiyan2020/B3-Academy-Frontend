import { apiFetch } from '@/lib/api/base-fetch';
import type { SearchGlobalParams, SearchResponseDto } from '../types/search.types';

const DEFAULT_PER_GROUP = 5;

/**
 * Global platform search. Public endpoint — no auth required.
 * `q` must be 2–120 chars; `perGroup` clamps to 1–20 (default 5).
 */
export async function searchGlobal({ q, perGroup = DEFAULT_PER_GROUP }: SearchGlobalParams): Promise<SearchResponseDto> {
  // Backend validates per_group as max:20 (min:1) and returns 422 if out of range — clamp defensively.
  const boundedPerGroup = Math.min(20, Math.max(1, Math.trunc(perGroup) || DEFAULT_PER_GROUP));
  const response = await apiFetch<SearchResponseDto>('/api/user/search', {
    query: {
      q,
      per_group: boundedPerGroup,
    },
  });

  return {
    query: response?.query ?? q,
    total_results: response?.total_results ?? 0,
    groups: Array.isArray(response?.groups) ? response.groups : [],
  };
}
