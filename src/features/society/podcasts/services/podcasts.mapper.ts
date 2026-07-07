import type { Podcast } from '@/features/podcasts/types/podcast.types';
import type { BackendPodcastEpisode, BackendPodcastList, PodcastListResult } from '../types';

function localized(value: BackendPodcastEpisode['title']) {
  return {
    en: value?.en || value?.ar || '',
    ar: value?.ar || value?.en || '',
  };
}

export function mapPodcastEpisode(item: BackendPodcastEpisode, index = 0): Podcast {
  const requiresSubscription = Boolean(item.requires_subscription || item.access_level === 'subscriber');
  return {
    id: String(item.id),
    title: localized(item.title),
    author: { en: 'B3 Academy', ar: 'أكاديمية B3' },
    category: { en: 'Podcast', ar: 'بودكاست' },
    categoryColor: 'bg-emerald-600',
    duration: '',
    description: localized(item.description),
    image: item.image || '',
    audioUrl: item.can_play === false ? '' : item.audio_url || '',
    status: item.status === false ? 'inactive' : 'active',
    accessLevel: requiresSubscription ? 'subscriber' : item.access_level || 'public',
    displayOrder: index + 1,
    publishedAt: item.published_at || '',
  };
}

export function mapPodcastList(payload: BackendPodcastList): PodcastListResult {
  const episodePayload = payload.episodes;
  const episodeItems = episodePayload?.items || episodePayload?.data || [];
  return {
    latest: (payload.latest || []).map(mapPodcastEpisode),
    episodes: episodeItems.map(mapPodcastEpisode),
    pagination: episodePayload?.pagination || episodePayload?.meta,
  };
}
