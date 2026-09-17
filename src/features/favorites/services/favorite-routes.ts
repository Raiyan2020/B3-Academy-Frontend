import { routes } from '@/lib/routing/routes';
import type { FavoritableType } from '../types/api.types';

/**
 * Maps a backend favoritable type to the site route that displays it.
 *
 * The API's `item.detail_endpoint` is an *API* path (e.g. `/api/v1/user/courses/5`),
 * not a page URL, so it cannot be used as an href directly.
 *
 * Returns `null` when no page route exists for that type — see PLANT_FUNGI_ENTRY
 * below. Callers must handle `null` by not rendering a link, rather than falling
 * back to a guessed URL that would 404.
 */
export function getFavoriteHref(type: FavoritableType | undefined, itemId: string): string | null {
  switch (type) {
    case 'course':
      return routes.courseDetail(itemId);
    case 'book':
      return routes.bookDetail(itemId);
    case 'clinic':
      return routes.clinicDetail(itemId);
    case 'trip_package':
      return routes.tripDetail(itemId);
    // Both encyclopedia kinds share one route and news/herb ids can collide, so
    // the kind must travel in the URL — EncyclopediaDetail reads `?kind=`.
    case 'encyclopedia_news':
      return `${routes.encyclopediaEntry(itemId)}?kind=news`;
    case 'herbal_library_entry':
      return `${routes.encyclopediaEntry(itemId)}?kind=herb`;
    // Plants & fungi are served by /monograph/[monographId], which renders
    // PlantFungiDetailPage (src/app/(library)/monograph/[monographId]/page.tsx).
    case 'plant_fungi_entry':
      return routes.monographDetail(itemId);
    default:
      return null;
  }
}
