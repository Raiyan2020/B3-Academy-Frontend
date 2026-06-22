import type { AccessLevel, ContentStatus } from '@/features/business/status.types';
import type { LocalizedString } from '../../../../types';

export interface Podcast {
  id: string;
  title: LocalizedString;
  author: LocalizedString;
  category: LocalizedString;
  categoryColor: string;
  duration: string;
  description: LocalizedString;
  image: string;
  audioUrl: string;
  status: ContentStatus;
  accessLevel: AccessLevel;
  displayOrder: number;
  publishedAt: string;
}

export interface PodcastPlaybackState {
  podcastId: string;
  position: number;
  isPaused: boolean;
  updatedAt: string;
}
