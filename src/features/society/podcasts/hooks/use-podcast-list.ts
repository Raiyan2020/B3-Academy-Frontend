'use client';

import { useQuery } from '@tanstack/react-query';
import { getPodcastList } from '../services/podcasts.service';
import { podcastKeys } from './podcasts.keys';

export function usePodcastList(filters?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: podcastKeys.list(filters),
    queryFn: () => getPodcastList(filters),
  });
}
