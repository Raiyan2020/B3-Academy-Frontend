import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { Podcast, PodcastPlaybackState } from '../types/podcast.types';

const PLAYBACK_KEY = 'b3-podcast-playback';

export function canAccessPodcast(
  podcast: Podcast,
  context: { isAuthenticated: boolean; isSubscribed: boolean },
): boolean {
  if (podcast.status !== 'active') return false;
  if (podcast.accessLevel === 'public') return true;
  if (podcast.accessLevel === 'authenticated') return context.isAuthenticated;
  if (podcast.accessLevel === 'subscriber') return context.isAuthenticated && context.isSubscribed;
  return false;
}

export function getPlaybackState(): PodcastPlaybackState | null {
  // Whether the podcast still exists is the caller's question — only the backend knows.
  return readLocalStorageJson<PodcastPlaybackState | null>(PLAYBACK_KEY, null);
}

export function savePlaybackState(state: PodcastPlaybackState) {
  writeLocalStorageJson(PLAYBACK_KEY, state);
}

export function clearPlaybackState() {
  writeLocalStorageJson(PLAYBACK_KEY, null);
}
