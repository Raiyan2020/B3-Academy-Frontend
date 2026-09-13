import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteFavorite, getFavorites, toggleFavorite } from '../services/favorites.service';
import type { FavoritableType } from '../types/api.types';
import { favoriteKeys } from '../query-keys';

export function useFavorites(type?: FavoritableType, page?: number, perPage?: number) {
  return useQuery({
    queryKey: favoriteKeys.list(type, page, perPage),
    queryFn: () => getFavorites({ type, page, perPage }),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: FavoritableType; id: string | number }) => toggleFavorite(type, id),
    meta: { silentSuccess: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}

export function useDeleteFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (favoriteId: string | number) => deleteFavorite(favoriteId),
    meta: { successMessage: 'Removed from favorites.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}
