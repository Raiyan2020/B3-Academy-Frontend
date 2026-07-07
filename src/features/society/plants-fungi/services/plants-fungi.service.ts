import { apiFetch } from '@/lib/api/base-fetch';
import type { BackendPaginated, BackendPlantFungiCategory, BackendPlantFungiEntry } from '../types';
import { mapPlantFungiCategory, mapPlantFungiDetail, mapPlantFungiEntry } from './plants-fungi.mapper';

export async function getPlantFungiCategories() {
  const payload = await apiFetch<BackendPlantFungiCategory[]>('/api/user/plants-fungi/categories');
  return payload.map(mapPlantFungiCategory);
}

export async function getPlantFungiList(filters?: { search?: string; categoryId?: string; page?: number }) {
  const payload = await apiFetch<BackendPaginated<BackendPlantFungiEntry> | BackendPlantFungiEntry[]>(
    '/api/user/plants-fungi',
    {
      query: {
        'filters[search]': filters?.search,
        'filters[plant_fungi_category_id]': filters?.categoryId,
        page: filters?.page,
      },
    },
  );
  const items = Array.isArray(payload) ? payload : payload.items || payload.data || [];
  return {
    items: items.map(mapPlantFungiEntry),
    pagination: Array.isArray(payload) ? undefined : payload.pagination || payload.meta,
  };
}

export async function getPlantFungiDetail(id: string) {
  const payload = await apiFetch<BackendPlantFungiEntry>(`/api/user/plants-fungi/${id}`);
  return mapPlantFungiDetail(payload);
}
