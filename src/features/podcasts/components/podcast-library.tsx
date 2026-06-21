'use client';

import { Pause, Play, Search, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { usePodcastPlayer } from './podcast-player-provider';
import { getPodcasts } from '../services/podcasts.service';

export const Podcasts: React.FC = () => {
  const { t, localize } = useLanguage();
  const { currentPodcast, isPlaying, playPodcast } = usePodcastPlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const podcasts = getPodcasts();
  const suggestedPodcasts = podcasts.slice(0, 3);
  const allPodcasts = podcasts.filter((podcast) =>
    localize(podcast.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
    localize(podcast.description).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-800">{t('podcast.title')}</h1>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-slate-800">{t('podcast.sub')}</h2>
          <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6">
            {suggestedPodcasts.map((podcast) => (
              <button
                key={podcast.id}
                className="group relative h-48 min-w-[85%] snap-center overflow-hidden rounded-lg text-left shadow-lg md:min-w-[60%] lg:min-w-[40%]"
                onClick={() => playPodcast(podcast)}
              >
                <img src={podcast.image} alt={localize(podcast.title)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-4 sm:p-6">
                  <div>
                    <span className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold text-white ${podcast.categoryColor}`}>
                      {localize(podcast.category)}
                    </span>
                    <h3 className="mb-1 text-xl font-bold text-white sm:text-2xl">{localize(podcast.title)}</h3>
                    <p className="text-sm text-slate-300 sm:text-base">{localize(podcast.author)}</p>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl transition-transform group-hover:scale-110">
                    {currentPodcast?.id === podcast.id && isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-2xl font-bold text-slate-800">All Episodes</h2>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search episodes..."
                className="w-full rounded-md border border-stone-200 bg-white py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>

          <div className="space-y-4">
            {allPodcasts.length > 0 ? (
              allPodcasts.map((podcast, index) => (
                <button
                  key={podcast.id}
                  className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-100/50 p-4 text-left shadow-sm transition-shadow hover:shadow-md sm:p-6"
                  onClick={() => playPodcast(podcast)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold uppercase text-emerald-800">
                        {t('podcast.episode')} {index + 1}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-stone-500">
                        <Volume2 size={12} />
                        {podcast.duration.replace(':00', '')} {t('podcast.duration')}
                      </span>
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-stone-800 sm:text-xl">{localize(podcast.title)}</h3>
                    <p className="text-sm leading-relaxed text-stone-600 sm:text-base">{localize(podcast.description)}</p>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg transition-colors group-hover:bg-emerald-600 sm:h-14 sm:w-14">
                    {currentPodcast?.id === podcast.id && isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
                  </span>
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500">No episodes found matching "{searchQuery}"</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export { Podcasts as PodcastLibrary };
