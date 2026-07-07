import { apiFetch } from '@/lib/api/base-fetch';
import type { BackendPodcastEpisode, BackendPodcastList } from '../types';
import { mapPodcastEpisode, mapPodcastList } from './podcasts.mapper';

export async function getPodcastList(filters?: { search?: string; page?: number }) {
  const payload = await apiFetch<BackendPodcastList>('/api/user/podcast', {
    query: {
      'filters[search]': filters?.search,
      page: filters?.page,
    },
  });
  return mapPodcastList(payload);
}

export async function getPodcastDetail(id: string) {
  const payload = await apiFetch<BackendPodcastEpisode>(`/api/user/podcast/${id}`);
  return mapPodcastEpisode(payload);
}
