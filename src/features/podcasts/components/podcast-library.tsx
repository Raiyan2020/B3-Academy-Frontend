'use client';

import { Lock, Pause, Play, Search, Volume2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../../../LanguageContext';
import { useAuth } from '@/features/auth/auth-provider';
import { usePodcastPlayer } from './podcast-player-provider';
import { canAccessPodcast, getFeaturedPodcasts, getPodcasts } from '../services/podcasts.service';
import type { Podcast } from '../types/podcast.types';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';

function AccessBadge({ podcast, isAr }: { podcast: Podcast; isAr: boolean }) {
  if (podcast.accessLevel === 'public') return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
      <Lock size={10} />
      {podcast.accessLevel === 'subscriber' ? (isAr ? 'مشترك' : 'Subscriber') : isAr ? 'مسجل' : 'Members'}
    </span>
  );
}

export const Podcasts: React.FC = () => {
  const { t, localize, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const { currentPodcast, isPlaying, playPodcast } = usePodcastPlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const isAr = language === 'ar';

  const accessContext = {
    isAuthenticated: Boolean(user),
    isSubscribed: isSubscriptionActive(user),
  };

  const suggestedPodcasts = getFeaturedPodcasts(3);
  const allPodcasts = getPodcasts().filter(
    (podcast) =>
      localize(podcast.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
      localize(podcast.description).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handlePlay = (podcast: Podcast) => {
    if (canAccessPodcast(podcast, accessContext)) {
      playPodcast(podcast);
      return;
    }
    if (user && podcast.accessLevel === 'subscriber' && !accessContext.isSubscribed) {
      router.push('/subscriptions');
      return;
    }
    if (!user && podcast.accessLevel !== 'public') {
      router.push('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-800">{t('podcast.title')}</h1>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-slate-800">{t('podcast.sub')}</h2>
          <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6">
            {suggestedPodcasts.map((podcast) => {
              const locked = !canAccessPodcast(podcast, accessContext);
              return (
                <button
                  key={podcast.id}
                  className="group relative h-48 min-w-[85%] snap-center overflow-hidden rounded-lg text-left shadow-lg md:min-w-[60%] lg:min-w-[40%]"
                  onClick={() => handlePlay(podcast)}
                >
                  <img src={podcast.image} alt={localize(podcast.title)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-4 sm:p-6">
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold text-white ${podcast.categoryColor}`}>
                          {localize(podcast.category)}
                        </span>
                        <AccessBadge podcast={podcast} isAr={isAr} />
                      </div>
                      <h3 className="mb-1 text-xl font-bold text-white sm:text-2xl">{localize(podcast.title)}</h3>
                      <p className="text-sm text-slate-300 sm:text-base">{localize(podcast.author)}</p>
                      {locked && (
                        <p className="mt-2 text-xs text-amber-200">
                          {podcast.accessLevel === 'subscriber'
                            ? isAr
                              ? 'يتطلب اشتراكاً نشطاً'
                              : 'Active subscription required'
                            : isAr
                              ? 'يتطلب تسجيل الدخول'
                              : 'Sign-in required'}
                          {!user && podcast.accessLevel !== 'public' && (
                            <>
                              {' — '}
                              <Link href="/auth" className="underline" onClick={(e) => e.stopPropagation()}>
                                {isAr ? 'تسجيل الدخول' : 'Sign in'}
                              </Link>
                            </>
                          )}
                          {user && podcast.accessLevel === 'subscriber' && !accessContext.isSubscribed && (
                            <>
                              {' — '}
                              <span className="underline">{isAr ? 'اشترك الآن' : 'Subscribe now'}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-xl ${locked ? 'bg-slate-600' : 'bg-emerald-500 transition-transform group-hover:scale-110'}`}>
                      {locked ? <Lock size={20} /> : currentPodcast?.id === podcast.id && isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-2xl font-bold text-slate-800">{isAr ? 'كل الحلقات' : 'All Episodes'}</h2>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder={isAr ? 'ابحث في الحلقات...' : 'Search episodes...'}
                className="w-full rounded-md border border-stone-200 bg-white py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>

          <div className="space-y-4">
            {allPodcasts.length > 0 ? (
              allPodcasts.map((podcast, index) => {
                const locked = !canAccessPodcast(podcast, accessContext);
                return (
                  <button
                    key={podcast.id}
                    className={`group flex w-full items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-100/50 p-4 text-left shadow-sm transition-shadow sm:p-6 ${locked ? 'opacity-80' : 'cursor-pointer hover:shadow-md'}`}
                    onClick={() => handlePlay(podcast)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold uppercase text-emerald-800">
                          {t('podcast.episode')} {index + 1}
                        </span>
                        <AccessBadge podcast={podcast} isAr={isAr} />
                        <span className="flex items-center gap-1 text-xs text-stone-500">
                          <Volume2 size={12} />
                          {podcast.duration.replace(':00', '')} {t('podcast.duration')}
                        </span>
                      </div>
                      <h3 className="mb-1 text-lg font-bold text-stone-800 sm:text-xl">{localize(podcast.title)}</h3>
                      <p className="text-sm leading-relaxed text-stone-600 sm:text-base">{localize(podcast.description)}</p>
                    </div>
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg sm:h-14 sm:w-14 ${locked ? 'bg-stone-500' : 'bg-stone-900 transition-colors group-hover:bg-emerald-600'}`}>
                      {locked ? <Lock size={20} /> : currentPodcast?.id === podcast.id && isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-500">
                {isAr ? 'لا توجد حلقات مطابقة.' : `No episodes found matching "${searchQuery}"`}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export { Podcasts as PodcastLibrary };
