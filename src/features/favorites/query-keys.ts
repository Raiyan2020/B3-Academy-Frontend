import type { FavoritableType } from './types/api.types';

export const favoriteKeys = {
  all: ['favorites'] as const,
  lists: () => [...favoriteKeys.all, 'list'] as const,
  list: (type?: FavoritableType, page?: number, perPage?: number) =>
    [...favoriteKeys.lists(), type ?? 'all', page ?? 1, perPage ?? 15] as const,
};
