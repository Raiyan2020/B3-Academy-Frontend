'use client';

import { useLanguage } from '../../../../LanguageContext';
import { useCommunityPostList } from './hooks/use-community-post-list';
import { CommunityPostListView } from './ui/CommunityPostListView';
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
  const query = useCommunityPostList(type);
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

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
