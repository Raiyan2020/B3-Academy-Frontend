import { z } from 'zod';

// Backend enum: App\Enums\FavoriteFavoritableTypeEnum (FavoriteFavoritableTypeEnum::values()).
export const FAVORITABLE_TYPES = [
  'course',
  'book',
  'encyclopedia_news',
  'herbal_library_entry',
  'clinic',
  'trip_package',
  'plant_fungi_entry',
] as const;

export const favoritableTypeSchema = z.enum(FAVORITABLE_TYPES);

export type FavoritableType = z.infer<typeof favoritableTypeSchema>;

// FavoriteFavoritableTypeEnum::getFullObj() shape (EnumRetriever trait) — exact keys
// not pinned by the delta doc beyond "value + translated label", so this is kept
// loose/passthrough rather than guessed field-by-field.
const favoriteTypeInfoSchema = z.looseObject({
  value: z.string().optional(),
  label: z.string().optional(),
});

// FavoriteResource.item — see docs/modernization/backend-api-delta.md "FavoriteResource (NEW)".
const favoriteItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  is_available: z.boolean(),
  can_open: z.boolean(),
  unavailable_reason: z.enum(['disabled_or_deleted', 'subscription_required']).nullable().optional(),
  requires_subscription: z.boolean(),
  redirect_hint: z.enum(['subscriptions']).nullable().optional(),
  detail_endpoint: z.string(),
});

export const favoriteResourceSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: favoriteTypeInfoSchema.optional(),
  favorited_at: z.string(),
  item: favoriteItemSchema,
});

export type FavoriteResource = z.infer<typeof favoriteResourceSchema>;

export const favoriteListSchema = z.array(favoriteResourceSchema);

// POST /favorites/toggle — plain array response, no envelope Resource.
export const toggleFavoriteResponseSchema = z.object({
  is_favorited: z.boolean(),
});

export type ToggleFavoriteResponse = z.infer<typeof toggleFavoriteResponseSchema>;

// Frontend-normalized shape used by the UI.
export interface FavoriteItem {
  id: string;
  type?: { value?: string; label?: string };
  favoritedAt: string;
  item: {
    id: string;
    title: string;
    image: string | null;
    isAvailable: boolean;
    canOpen: boolean;
    unavailableReason: 'disabled_or_deleted' | 'subscription_required' | null;
    requiresSubscription: boolean;
    redirectHint: 'subscriptions' | null;
    detailEndpoint: string;
  };
}

export interface FavoritesListFilters {
  type?: FavoritableType;
  page?: number;
  perPage?: number;
}
