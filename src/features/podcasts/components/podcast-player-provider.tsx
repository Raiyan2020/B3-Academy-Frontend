'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';
import type { Podcast } from '../types/podcast.types';

interface PodcastPlayerContextValue {
  currentPodcast: Podcast | null;
  isPlaying: boolean;
  playPodcast: (podcast: Podcast) => void;
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
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playPodcast = (podcast: Podcast) => {
    if (currentPodcast?.id === podcast.id) {
      setIsPlaying((value) => !value);
      return;
    }
    setCurrentPodcast(podcast);
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying((value) => !value);

  const closePlayer = () => {
    setIsPlaying(false);
    setCurrentPodcast(null);
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [currentPodcast, isPlaying]);

  return (
    <PodcastPlayerContext.Provider value={{ currentPodcast, isPlaying, playPodcast, togglePlay, closePlayer }}>
      {children}
      {currentPodcast && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-lg border border-slate-800 bg-slate-950 p-3 text-white shadow-2xl">
          <audio ref={audioRef} src={currentPodcast.audioUrl} onEnded={() => setIsPlaying(false)} />
          <div className="flex items-center gap-3">
            <img src={currentPodcast.image} alt={localize(currentPodcast.title)} className="h-12 w-12 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{localize(currentPodcast.title)}</p>
              <p className="truncate text-xs text-slate-400">{localize(currentPodcast.author)}</p>
            </div>
            <button onClick={togglePlay} className="rounded-md bg-emerald-600 p-3 text-white">
              {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
            </button>
            <button onClick={closePlayer} className="rounded-md border border-slate-700 p-3 text-slate-300">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </PodcastPlayerContext.Provider>
  );
}
