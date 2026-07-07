'use client';

import { useQuery } from '@tanstack/react-query';
import { libraryKeys } from '../query-keys';
import { getApiEncyclopediaDetail, getApiEncyclopediaItems } from '../services/encyclopedia-api.service';

export function useApiEncyclopediaItems(search?: string) {
  return useQuery({
    queryKey: [...libraryKeys.encyclopedia(), 'items', search || 'all'],
    queryFn: () => getApiEncyclopediaItems(search),
    retry: 1,
  });
}

export function useApiEncyclopediaDetail(id: string | undefined) {
  return useQuery({
    queryKey: libraryKeys.detail('encyclopedia', id || 'missing'),
    queryFn: () => getApiEncyclopediaDetail(id!),
    enabled: Boolean(id && /^\d+$/.test(id)),
    retry: 1,
  });
}
