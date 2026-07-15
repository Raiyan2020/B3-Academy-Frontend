'use client';

import { useLanguage } from '../../../../LanguageContext';
import { useAuth } from '@/features/auth/auth-provider';
import { useCommunityPostList } from './hooks/use-community-post-list';
import { CommunityPostListView } from './ui/CommunityPostListView';
import { CommunityPostAccessState } from './ui/CommunityPostAccessState';
import type { CommunityPostType } from './types';

export function CommunityPostListPage({
  type,
  title,
  description,
  emptyText,
}: {
  type: CommunityPostType;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  emptyText: { en: string; ar: string };
}) {
  const { language, localize } = useLanguage();
  const { user } = useAuth();
  const query = useCommunityPostList(type);
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  // Subscription-gated sections (e.g. research) 403 the whole list — show a subscribe/sign-in
  // CTA rather than a misleading "no content available" empty state.
  const accessError = query.error as { status?: number; key?: string } | null;
  if (query.isError && (accessError?.status === 403 || accessError?.key === 'subscription_required')) {
    return (
      <CommunityPostAccessState
        title={localize(title)}
        message={user
          ? (language === 'ar' ? 'هذا القسم متاح للمشتركين النشطين فقط.' : 'This section is available to active subscribers only.')
          : (language === 'ar' ? 'سجّل الدخول واشترك للوصول إلى هذا القسم.' : 'Sign in and subscribe to access this section.')}
        ctaHref={user ? '/subscriptions' : '/auth'}
        ctaLabel={user ? (language === 'ar' ? 'عرض الاشتراكات' : 'View subscriptions') : (language === 'ar' ? 'تسجيل الدخول' : 'Sign in')}
        requiresSubscription={Boolean(user)}
      />
    );
  }

  return (
    <CommunityPostListView
      title={localize(title)}
      description={localize(description)}
      items={query.data?.items || []}
      emptyText={query.isLoading ? (language === 'ar' ? 'جار التحميل...' : 'Loading...') : localize(emptyText)}
      lockedLabel={language === 'ar' ? 'للمشتركين' : 'Subscribers'}
      localize={localize}
      formatDate={(value) => (value ? new Date(value).toLocaleDateString(locale) : '')}
    />
  );
}
