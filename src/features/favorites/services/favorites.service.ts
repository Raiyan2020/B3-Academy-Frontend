import { z } from 'zod';
import { apiFetch } from '@/lib/api/base-fetch';
import {
  favoriteListSchema,
  favoritableTypeSchema,
  toggleFavoriteResponseSchema,
  type FavoritableType,
  type FavoriteItem,
  type FavoriteResource,
  type FavoritesListFilters,
} from '../types/api.types';

// App\Traits\PaginationTrait::paginatedData envelope.
const paginationSchema = z.object({
  current_page: z.number(),
  last_page: z.number(),
  per_page: z.number(),
  total: z.number(),
});

const paginatedFavoritesSchema = z.object({
  items: favoriteListSchema,
  pagination: paginationSchema,
});

export interface FavoritesPagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface FavoritesPage {
  items: FavoriteItem[];
  pagination: FavoritesPagination;
}

function mapFavorite(resource: FavoriteResource): FavoriteItem {
  return {
    id: String(resource.id),
    type: resource.type,
    favoritedAt: resource.favorited_at,
    item: {
      id: String(resource.item.id),
      title: resource.item.title ?? '',
      image: resource.item.image ?? null,
      isAvailable: resource.item.is_available,
      canOpen: resource.item.can_open,
      unavailableReason: resource.item.unavailable_reason ?? null,
      requiresSubscription: resource.item.requires_subscription,
      redirectHint: resource.item.redirect_hint ?? null,
      detailEndpoint: resource.item.detail_endpoint,
    },
  };
}

export async function getFavorites(filters: FavoritesListFilters = {}): Promise<FavoritesPage> {
  const response = await apiFetch<unknown>('/api/user/favorites', {
    query: {
      type: filters.type,
      per_page: filters.perPage,
      page: filters.page,
    },
  });
  const parsed = paginatedFavoritesSchema.parse(response);
  return {
    items: parsed.items.map(mapFavorite),
    pagination: {
      currentPage: parsed.pagination.current_page,
      lastPage: parsed.pagination.last_page,
      perPage: parsed.pagination.per_page,
      total: parsed.pagination.total,
    },
  };
}

export async function toggleFavorite(type: FavoritableType, id: string | number): Promise<boolean> {
  const validatedType = favoritableTypeSchema.parse(type);
  const response = await apiFetch<unknown>('/api/user/favorites/toggle', {
    method: 'POST',
    body: { type: validatedType, id: Number(id) },
  });
  return toggleFavoriteResponseSchema.parse(response).is_favorited;
}

export async function deleteFavorite(favoriteId: string | number): Promise<void> {
  await apiFetch<unknown>(`/api/user/favorites/${Number(favoriteId)}`, { method: 'DELETE' });
}
