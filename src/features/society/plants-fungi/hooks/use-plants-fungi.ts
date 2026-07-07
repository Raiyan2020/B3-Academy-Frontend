'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlantFungiCategories, getPlantFungiDetail, getPlantFungiList } from '../services/plants-fungi.service';
import { plantsFungiKeys } from './plants-fungi.keys';

export function usePlantFungiCategories() {
  return useQuery({
    queryKey: plantsFungiKeys.categories(),
    queryFn: getPlantFungiCategories,
  });
}

export function usePlantFungiList(filters?: { search?: string; categoryId?: string; page?: number }) {
  return useQuery({
    queryKey: plantsFungiKeys.list(filters),
    queryFn: () => getPlantFungiList(filters),
  });
}

export function usePlantFungiDetail(id: string | undefined) {
  return useQuery({
    queryKey: plantsFungiKeys.detail(id || ''),
    queryFn: () => getPlantFungiDetail(id || ''),
    enabled: Boolean(id),
  });
}
