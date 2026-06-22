import type { CommunitySection } from '@/features/business/business.types';

export const COMMUNITY_SECTIONS: CommunitySection[] = [
  {
    id: 'chat',
    title: { ar: 'المحادثة الجماعية', en: 'Group Chat' },
    description: {
      ar: 'مساحة نصية واحدة للمشتركين أصحاب الاشتراك الفعّال.',
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
      ar: 'حلقات صوتية عامة أو مقفولة حسب إعدادات الإدارة.',
      en: 'Audio episodes that can be public or subscriber-only.',
    },
    href: '/podcasts',
    accessLevel: 'public',
    isActive: true,
  },
  {
    id: 'blogs',
    title: { ar: 'المقالات', en: 'Articles' },
    description: {
      ar: 'مقالات معرفية يمكن أن تكون عامة أو مخصصة للمشتركين.',
      en: 'Knowledge articles that may be public or subscriber-only.',
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
    title: { ar: 'الأبحاث', en: 'Researches' },
    description: {
      ar: 'أبحاث ومحتوى علمي مع دعم الوصول العام أو المقفول.',
      en: 'Research content with public or subscriber-only access.',
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
  {
    id: 'monograph',
    title: { ar: 'موسوعة النباتات والفطريات', en: 'Plant and Fungi Encyclopedia' },
    description: {
      ar: 'موسوعة موحدة للمشتركين فقط، مع بحث وتصنيف ومفضلة.',
      en: 'A subscriber-only unified encyclopedia with search, category filtering, and favorites.',
    },
    href: '/monograph',
    accessLevel: 'subscriber',
    isActive: true,
  },
];

export function getActiveCommunitySections() {
  return COMMUNITY_SECTIONS.filter((section) => section.isActive);
}

