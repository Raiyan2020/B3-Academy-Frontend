'use client';

import { useQuery } from '@tanstack/react-query';
import { libraryKeys } from '../query-keys';
import {
  getApiEncyclopediaDetail,
  getApiEncyclopediaItems,
  getEncyclopediaNewsTypes,
  getHerbalFamilies,
  getHerbalGenera,
  getHerbalOrigins,
  getHerbalSpecies,
} from '../services/encyclopedia-api.service';
import type { EncyclopediaHerbFilters } from '../types/encyclopedia.types';

const TAXONOMY_STALE_TIME = 5 * 60 * 1000;

export function useApiEncyclopediaItems(filters: EncyclopediaHerbFilters = {}) {
  return useQuery({
    queryKey: [
      ...libraryKeys.encyclopedia(),
      'items',
      filters.search || 'all',
      filters.familyId ?? 0,
      filters.speciesId ?? 0,
      filters.genusId ?? 0,
      filters.originId ?? 0,
    ],
    queryFn: () => getApiEncyclopediaItems(filters),
    retry: 1,
  });
}

export function useHerbalFamilies() {
  return useQuery({
    queryKey: libraryKeys.taxonomy('families'),
    queryFn: getHerbalFamilies,
    staleTime: TAXONOMY_STALE_TIME,
    retry: 1,
  });
}

export function useHerbalSpecies() {
  return useQuery({
    queryKey: libraryKeys.taxonomy('species'),
    queryFn: getHerbalSpecies,
    staleTime: TAXONOMY_STALE_TIME,
    retry: 1,
  });
}

export function useHerbalGenera() {
  return useQuery({
    queryKey: libraryKeys.taxonomy('genera'),
    queryFn: getHerbalGenera,
    staleTime: TAXONOMY_STALE_TIME,
    retry: 1,
  });
}

export function useHerbalOrigins() {
  return useQuery({
    queryKey: libraryKeys.taxonomy('origins'),
    queryFn: getHerbalOrigins,
    staleTime: TAXONOMY_STALE_TIME,
    retry: 1,
  });
}

export function useEncyclopediaNewsTypes() {
  return useQuery({
    queryKey: libraryKeys.taxonomy('news-types'),
    queryFn: getEncyclopediaNewsTypes,
    staleTime: TAXONOMY_STALE_TIME,
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
