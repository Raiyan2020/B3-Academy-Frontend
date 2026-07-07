'use client';

import type { Podcast } from '@/features/podcasts/types/podcast.types';
import { PodcastEpisodeCard } from './PodcastEpisodeCard';

export function PodcastPageView({
  title,
  latestTitle,
  allTitle,
  emptyText,
  latest,
  episodes,
  lockedLabel,
  localize,
  onPlay,
}: {
  title: string;
  latestTitle: string;
  allTitle: string;
  emptyText: string;
  latest: Podcast[];
  episodes: Podcast[];
  lockedLabel: string;
  localize: (value: { en: string; ar: string }) => string;
  onPlay: (podcast: Podcast) => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50 py-12 pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-10 text-4xl font-bold text-slate-950">{title}</h1>
        {latest.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-bold text-slate-900">{latestTitle}</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              {latest.map((podcast) => (
                <PodcastEpisodeCard key={podcast.id} podcast={podcast} title={localize(podcast.title)} description={localize(podcast.description)} lockedLabel={lockedLabel} onPlay={() => onPlay(podcast)} />
              ))}
            </div>
          </section>
        )}
        <section>
          <h2 className="mb-5 text-2xl font-bold text-slate-900">{allTitle}</h2>
          {episodes.length > 0 ? (
            <div className="space-y-4">
              {episodes.map((podcast) => (
                <PodcastEpisodeCard key={podcast.id} podcast={podcast} title={localize(podcast.title)} description={localize(podcast.description)} lockedLabel={lockedLabel} onPlay={() => onPlay(podcast)} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
              {emptyText}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
