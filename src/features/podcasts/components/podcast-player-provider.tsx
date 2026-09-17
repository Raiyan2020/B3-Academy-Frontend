'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Pause, Play, X } from 'lucide-react';
import { useLanguage } from '@/LanguageContext';
import { useAuth } from '@/features/auth/auth-provider';
import type { Podcast } from '../types/podcast.types';
import {
  canAccessPodcast,
  clearPlaybackState,
  getPlaybackState,
  savePlaybackState,
} from '../services/podcasts.service';
import { getPodcastDetail } from '@/features/society/podcasts/services/podcasts.service';
import { useIsSubscriptionActive } from '@/features/subscriptions/hooks/use-subscriptions';

interface PodcastPlayerContextValue {
  currentPodcast: Podcast | null;
  isPlaying: boolean;
  playPodcast: (podcast: Podcast) => boolean;
  togglePlay: () => void;
  closePlayer: () => void;
}

const PodcastPlayerContext = createContext<PodcastPlayerContextValue | null>(null);

export function usePodcastPlayer() {
  const context = useContext(PodcastPlayerContext);
  if (!context) throw new Error('usePodcastPlayer must be used within PodcastPlayerProvider');
  return context;
}

export function PodcastPlayerProvider({ children }: { children: React.ReactNode }) {
  const { localize } = useLanguage();
  const { user, isAuthReady } = useAuth();
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const restoredRef = useRef(false);
  const isSubscribed = useIsSubscriptionActive();

  const accessContext = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isSubscribed,
    }),
    [user, isSubscribed],
  );

  useEffect(() => {
    if (!isAuthReady || restoredRef.current) return;
    restoredRef.current = true;
    const saved = getPlaybackState();
    if (!saved) return;

    let cancelled = false;
    getPodcastDetail(saved.podcastId)
      .then((podcast) => {
        if (cancelled) return;
        if (!podcast || !canAccessPodcast(podcast, accessContext)) {
          clearPlaybackState();
          return;
        }
        setCurrentPodcast(podcast);
        setIsPlaying(!saved.isPaused);
        requestAnimationFrame(() => {
          if (audioRef.current && saved.position > 0) {
            audioRef.current.currentTime = saved.position;
          }
        });
      })
      // Deleted episode, revoked access, offline — drop the stale state rather than
      // leaving the player pointing at something the backend will not serve.
      .catch(() => {
        if (!cancelled) clearPlaybackState();
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, accessContext]);

  const playPodcast = (podcast: Podcast) => {
    if (!canAccessPodcast(podcast, accessContext)) return false;
    if (currentPodcast?.id === podcast.id) {
      setIsPlaying((value) => !value);
      return true;
    }
    setCurrentPodcast(podcast);
    setIsPlaying(true);
    return true;
  };

  const togglePlay = () => setIsPlaying((value) => !value);

  const closePlayer = () => {
    setIsPlaying(false);
    setCurrentPodcast(null);
    clearPlaybackState();
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [currentPodcast, isPlaying]);

  useEffect(() => {
    if (!currentPodcast) return;
    const audio = audioRef.current;
    if (!audio) return;

    const persist = () => {
      savePlaybackState({
        podcastId: currentPodcast.id,
        position: audio.currentTime,
        isPaused: audio.paused,
        updatedAt: new Date().toISOString(),
      });
    };

    const interval = window.setInterval(persist, 3000);
    audio.addEventListener('pause', persist);
    audio.addEventListener('timeupdate', persist);
    return () => {
      window.clearInterval(interval);
      audio.removeEventListener('pause', persist);
      audio.removeEventListener('timeupdate', persist);
    };
  }, [currentPodcast]);

  return (
    <PodcastPlayerContext.Provider value={{ currentPodcast, isPlaying, playPodcast, togglePlay, closePlayer }}>
      {children}
      {currentPodcast && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-lg border border-slate-800 bg-slate-950 p-3 text-white shadow-2xl">
          <audio ref={audioRef} src={currentPodcast.audioUrl} onEnded={() => setIsPlaying(false)} />
          <div className="flex items-center gap-3">
            <Image src={currentPodcast.image} alt={localize(currentPodcast.title)} width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{localize(currentPodcast.title)}</p>
              <p className="truncate text-xs text-slate-400">{localize(currentPodcast.author)}</p>
            </div>
            <button
              onClick={togglePlay}
              aria-label={localize(isPlaying ? { ar: 'إيقاف مؤقت', en: 'Pause' } : { ar: 'تشغيل', en: 'Play' })}
              className="rounded-md bg-emerald-600 p-3 text-white"
            >
              {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
            </button>
            <button
              onClick={closePlayer}
              aria-label={localize({ ar: 'إغلاق المشغل', en: 'Close player' })}
              className="rounded-md border border-slate-700 p-3 text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </PodcastPlayerContext.Provider>
  );
}
