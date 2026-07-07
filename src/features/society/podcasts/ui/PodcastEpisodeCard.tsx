'use client';

import { Lock, Play } from 'lucide-react';
import type { Podcast } from '@/features/podcasts/types/podcast.types';

export function PodcastEpisodeCard({
  podcast,
  title,
  description,
  lockedLabel,
  onPlay,
}: {
  podcast: Podcast;
  title: string;
  description: string;
  lockedLabel: string;
  onPlay: () => void;
}) {
  const locked = podcast.accessLevel === 'subscriber';
  return (
    <button onClick={onPlay} className="flex w-full gap-4 rounded-lg border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      {podcast.image && <img src={podcast.image} alt={title} className="h-24 w-24 shrink-0 rounded-md object-cover" />}
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          {locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
              <Lock className="h-3 w-3" />
              {lockedLabel}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
        <Play className="h-5 w-5" fill="currentColor" />
      </span>
    </button>
  );
}
