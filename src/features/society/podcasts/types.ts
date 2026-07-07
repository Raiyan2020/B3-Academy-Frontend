import type { Podcast } from '@/features/podcasts/types/podcast.types';
import type { LocalizedString } from '../../../../types';

export interface BackendPodcastEpisode {
  id: number | string;
  title?: Partial<LocalizedString> | null;
  description?: Partial<LocalizedString> | null;
  image?: string | null;
  audio_url?: string | null;
  published_at?: string | null;
  status?: boolean | string;
  access_level?: 'public' | 'subscriber' | 'authenticated';
  requires_subscription?: boolean;
  can_play?: boolean;
}

export interface BackendPodcastList {
  latest?: BackendPodcastEpisode[];
  episodes?: {
    items?: BackendPodcastEpisode[];
    data?: BackendPodcastEpisode[];
    pagination?: unknown;
    meta?: unknown;
  };
}

export interface PodcastListResult {
  latest: Podcast[];
  episodes: Podcast[];
  pagination?: unknown;
}
