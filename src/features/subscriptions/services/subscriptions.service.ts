import type { CurrencyCode, SubscriptionPlan } from '@/features/business/business.types';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly-community',
    name: { ar: 'اشتراك المجتمع الشهري', en: 'Monthly Community Plan' },
    description: {
      ar: 'وصول شهري إلى المحتوى المقفول، المحادثة الجماعية، وموسوعة النباتات والفطريات.',
      en: 'Monthly access to locked content, group chat, and the plant and fungi encyclopedia.',
    },
    features: [
      { ar: 'فتح المقالات والنظريات والأبحاث المقفولة', en: 'Unlock locked articles, theories, and researches' },
      { ar: 'الدخول إلى المحادثة الجماعية للمشتركين', en: 'Access subscriber group chat' },
      { ar: 'تصفح موسوعة النباتات والفطريات', en: 'Browse the plant and fungi encyclopedia' },
    ],
    durationDays: 30,
    prices: { USD: 19, EUR: 18, GBP: 16, AED: 70, JPY: 3000, CNH: 138 },
    isActive: true,
  },
  {
    id: 'annual-community',
    name: { ar: 'اشتراك المجتمع السنوي', en: 'Annual Community Plan' },
    description: {
      ar: 'اشتراك سنوي للمحتوى المجتمعي المقفول مع مدة أطول وسعر أفضل.',
      en: 'Annual access to locked community content with a longer term and better value.',
    },
    features: [
      { ar: 'كل مزايا الاشتراك الشهري', en: 'All monthly plan benefits' },
      { ar: 'صلاحية لمدة سنة كاملة', en: 'Full year access' },
      { ar: 'تجديد يدوي بدون خصم تلقائي', en: 'Manual renewal with no auto-charge' },
    ],
    durationDays: 365,
    prices: { USD: 190, EUR: 178, GBP: 155, AED: 698, JPY: 30000, CNH: 1380 },
    isActive: true,
  },
];

export function getActiveSubscriptionPlans() {
  return SUBSCRIPTION_PLANS.filter((plan) => plan.isActive);
}

export function formatPlanDuration(days: number, locale: 'ar' | 'en') {
  if (days >= 365) return locale === 'ar' ? 'سنة واحدة' : 'One year';
  if (days >= 30) return locale === 'ar' ? 'شهر واحد' : 'One month';
  return locale === 'ar' ? `${days} يوم` : `${days} days`;
}

export function getPlanPrice(plan: SubscriptionPlan, currency: CurrencyCode) {
  return plan.prices[currency] ?? plan.prices.USD;
}

