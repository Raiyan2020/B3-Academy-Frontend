import type { CommunitySection } from '@/features/business/business.types';

export const COMMUNITY_SECTIONS: CommunitySection[] = [
  {
    id: 'chat',
    title: { ar: 'المحادثة الجماعية', en: 'Group Chat' },
    description: {
      ar: 'مساحة نصية واحدة للمشتركين أصحاب الاشتراك الفعال.',
      en: 'One text-only space for customers with an active subscription.',
    },
    href: '/community/chat',
    accessLevel: 'subscriber',
    isActive: true,
  },
  {
    id: 'podcasts',
    title: { ar: 'البودكاست', en: 'Podcasts' },
    description: {
      ar: 'تصفح حلقات البودكاست المفعلة التي أضافتها الإدارة.',
      en: 'Browse active podcast episodes published by administration.',
    },
    href: '/podcasts',
    accessLevel: 'public',
    isActive: true,
  },
  {
    id: 'blogs',
    title: { ar: 'المقالات', en: 'Articles' },
    description: {
      ar: 'مقالات معرفية عامة أو مقفولة حسب إعدادات الإدارة.',
      en: 'Knowledge articles with access rules controlled by the backend.',
    },
    href: '/community/blogs',
    accessLevel: 'public',
    isActive: true,
  },
  {
    id: 'theories',
    title: { ar: 'النظريات', en: 'Theories' },
    description: {
      ar: 'نظريات منشورة داخل المجتمع مع قواعد وصول وتفاعل.',
      en: 'Published theories with access and interaction rules.',
    },
    href: '/community/theories',
    accessLevel: 'public',
    isActive: true,
  },
  {
    id: 'researches',
    title: { ar: 'الأبحاث', en: 'Research' },
    description: {
      ar: 'أبحاث ومحتوى علمي وفق قواعد الوصول التي يحددها backend.',
      en: 'Research content following backend-defined access rules.',
    },
    href: '/community/researches',
    accessLevel: 'public',
    isActive: true,
  },
  {
    id: 'cooperation',
    title: { ar: 'التعاون والاقتراحات', en: 'Cooperation and Suggestions' },
    description: {
      ar: 'إرسال طلب تعاون أو اقتراح بعد تسجيل الدخول واختيار نوع الطلب.',
      en: 'Send a cooperation request or suggestion after signing in.',
    },
    href: '/community/cooperation',
    accessLevel: 'public',
    isActive: true,
  },
];

export function getActiveCommunitySections() {
  return COMMUNITY_SECTIONS.filter((section) => section.isActive);
}
