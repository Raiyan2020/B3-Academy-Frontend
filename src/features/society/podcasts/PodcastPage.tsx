'use client';

import { useRouter } from 'next/navigation';
import type { Podcast } from '@/features/podcasts/types/podcast.types';
import { useAuth } from '@/features/auth/auth-provider';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';
import { usePodcastPlayer } from '@/features/podcasts/components/podcast-player-provider';
import { useLanguage } from '../../../../LanguageContext';
import { usePodcastList } from './hooks/use-podcast-list';
import { PodcastPageView } from './ui/PodcastPageView';

export function PodcastPage() {
  const { language, localize } = useLanguage();
  const { user, requireAuthAction } = useAuth();
  const router = useRouter();
  const player = usePodcastPlayer();
  const query = usePodcastList();

  const handlePlay = (podcast: Podcast) => {
    if (podcast.accessLevel === 'subscriber' && !isSubscriptionActive(user)) {
      if (!user) {
        requireAuthAction();
        return;
      }
      router.push('/subscriptions');
      return;
    }
    if (!podcast.audioUrl) {
      router.push('/subscriptions');
      return;
    }
    player.playPodcast(podcast);
  };

  return (
    <PodcastPageView
      title={language === 'ar' ? 'البودكاست' : 'Podcasts'}
      latestTitle={language === 'ar' ? 'أحدث الحلقات' : 'Latest episodes'}
      allTitle={language === 'ar' ? 'كل الحلقات' : 'All episodes'}
      emptyText={query.isLoading ? (language === 'ar' ? 'جار التحميل...' : 'Loading...') : (language === 'ar' ? 'لا توجد حلقات متاحة.' : 'No episodes are available.')}
      latest={query.data?.latest || []}
      episodes={query.data?.episodes || []}
      lockedLabel={language === 'ar' ? 'للمشتركين' : 'Subscribers'}
      localize={localize}
      onPlay={handlePlay}
    />
  );
}
