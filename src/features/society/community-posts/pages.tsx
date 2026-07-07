'use client';

import { CommunityPostDetailPage } from './CommunityPostDetailPage';
import { CommunityPostListPage } from './CommunityPostListPage';

export function BlogsPage() {
  return (
    <CommunityPostListPage
      type="article"
      title={{ en: 'Articles', ar: 'المقالات' }}
      description={{ en: 'Read active articles published by B3 Academy.', ar: 'تصفح المقالات المفعلة المنشورة من أكاديمية B3.' }}
      emptyText={{ en: 'No active articles are available.', ar: 'لا توجد مقالات مفعلة حالياً.' }}
    />
  );
}

export function BlogDetailPage() {
  return <CommunityPostDetailPage type="article" />;
}

export function TheoriesPage() {
  return (
    <CommunityPostListPage
      type="theory"
      title={{ en: 'Theories', ar: 'النظريات' }}
      description={{ en: 'Explore active theories published in the community.', ar: 'تصفح النظريات المفعلة المنشورة داخل المجتمع.' }}
      emptyText={{ en: 'No active theories are available.', ar: 'لا توجد نظريات مفعلة حالياً.' }}
    />
  );
}

export function TheoryDetailPage() {
  return <CommunityPostDetailPage type="theory" />;
}

export function ResearchesPage() {
  return (
    <CommunityPostListPage
      type="research"
      title={{ en: 'Research', ar: 'الأبحاث' }}
      description={{ en: 'Explore active research published in the community.', ar: 'تصفح الأبحاث المفعلة المنشورة داخل المجتمع.' }}
      emptyText={{ en: 'No active research is available.', ar: 'لا توجد أبحاث مفعلة حالياً.' }}
    />
  );
}

export function ResearchDetailPage() {
  return <CommunityPostDetailPage type="research" />;
}
