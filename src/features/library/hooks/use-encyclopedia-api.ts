'use client';

import { useQuery } from '@tanstack/react-query';
import { libraryKeys } from '../query-keys';
import {
  getApiEncyclopediaDetail,
  getApiEncyclopediaItems,
  getApiHerbalFamilies,
  getApiHerbalGenera,
  getApiHerbalOrigins,
  getApiHerbalSpecies,
  getApiNewsTypes,
  type HerbalApiFilters,
} from '../services/encyclopedia-api.service';

export function useApiEncyclopediaItems(search?: string, filters?: HerbalApiFilters, newsTypeId?: string) {
  return useQuery({
    queryKey: [...libraryKeys.encyclopedia(), 'items', search || 'all', filters || {}, newsTypeId || 'all-types'],
    queryFn: () => getApiEncyclopediaItems(search, filters, newsTypeId),
    retry: 1,
  });
}

export function useApiNewsTypes() {
  return useQuery({
    queryKey: [...libraryKeys.encyclopediaFilters(), 'news-types'],
    queryFn: getApiNewsTypes,
    retry: 1,
  });
}

export function useApiHerbalFilters() {
  return useQuery({
    queryKey: libraryKeys.encyclopediaFilters(),
    queryFn: async () => {
      const [families, species, genera, origins] = await Promise.all([
        getApiHerbalFamilies(),
        getApiHerbalSpecies(),
        getApiHerbalGenera(),
        getApiHerbalOrigins(),
      ]);
      return { families, species, genera, origins };
    },
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
