'use client';

import type { LocalizedString } from '../../../../types';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

const ASSISTANT_CONFIG_KEY = 'b3-assistant-config';

export type AssistantLanguage = 'ar' | 'en';

export interface LocalizedKeywordList {
  ar: string[];
  en: string[];
}

export interface LocalizedAnswerList {
  ar: string[];
  en: string[];
}

export interface AssistantKeywordEntry {
  id: string;
  keywords: LocalizedKeywordList;
  answers: LocalizedAnswerList;
}

export interface AssistantConfig {
  enabled: boolean;
  welcomeMessage: LocalizedString;
  fallbackMessage: LocalizedString;
  outOfScopeMessage: LocalizedString;
  healthDisclaimer: LocalizedString;
  keywords: AssistantKeywordEntry[];
}

const HEALTH_KEYWORDS = [
  'health', 'medical', 'diagnosis', 'treat', 'symptom', 'disease', 'prescription', 'doctor', 'medicine', 'cure',
  'صحة', 'طبيب', 'تشخيص', 'علاج', 'مرض', 'أعراض', 'دواء', 'وصفة', 'طبي',
];

export function getDefaultAssistantConfig(): AssistantConfig {
  return {
    enabled: true,
    welcomeMessage: {
      ar: 'مرحباً! أنا مساعد B3. اكتب كلمة مفتاحية مثل "دورات" أو "اشتراك" أو "حجز" وسأساعدك في التنقل داخل المنصة.',
      en: 'Welcome! I am the B3 assistant. Type a keyword such as "courses", "subscription", or "booking" and I will help you navigate the platform.',
    },
    fallbackMessage: {
      ar: 'لم أجد إجابة مطابقة. جرّب كلمات مثل دورات، كتب، أو اشتراك.',
      en: 'I could not find a matching answer. Try keywords like courses, books, or subscription.',
    },
    outOfScopeMessage: {
      ar: 'عذراً، هذا السؤال خارج نطاق مساعد B3. يمكنني مساعدتك في أقسام المنصة والتسجيل والاشتراك والحجز والشراء وقواعد المحتوى المقفول فقط.',
      en: 'Sorry, that question is outside the B3 assistant scope. I can only help with platform sections, registration, subscriptions, booking, purchases, and locked-content rules.',
    },
    healthDisclaimer: {
      ar: 'تنبيه: مساعد B3 لا يقدم استشارات طبية أو تشخيصاً أو علاجاً. للأسئلة الصحية، يرجى استشارة مختص مؤهل أو استخدام خدمات الرعاية داخل المنصة.',
      en: 'Notice: The B3 assistant does not provide medical advice, diagnosis, or treatment. For health questions, please consult a qualified specialist or use the care services on the platform.',
    },
    keywords: [
      {
        id: 'kw-sections',
        keywords: { ar: ['أقسام', 'قسم', 'منصة', 'تعليم', 'رعاية'], en: ['sections', 'platform', 'education', 'care', 'community'] },
        answers: {
          ar: ['أقسام المنصة: التعليم (دورات/كتب/موسوعة)، الرعاية (عيادات/استشارات/رحلات)، المجتمع، الاشتراكات، والتقييمات.'],
          en: ['Platform sections: Education (courses/books/encyclopedia), Care (clinics/consultations/trips), Community, Subscriptions, and Ratings.'],
        },
      },
      {
        id: 'kw-courses',
        keywords: { ar: ['دورات', 'دورة', 'تعلم', 'تسجيل دورة'], en: ['courses', 'course', 'learn', 'enroll'] },
        answers: {
          ar: ['يمكنك تصفح الدورات من /courses والتسجيل بعد تسجيل الدخول عبر صفحة الدفع.'],
          en: ['Browse courses at /courses and enroll after signing in through checkout.'],
        },
      },
      {
        id: 'kw-books',
        keywords: { ar: ['كتب', 'كتاب', 'قراءة'], en: ['books', 'book', 'ebook', 'read'] },
        answers: {
          ar: ['الكتب متاحة بصيغ إلكترونية ومطبوعة. تصفح /books واختر النسخة ثم أكمل الشراء.'],
          en: ['Books are available in ebook and print formats. Browse /books, choose a format, then complete checkout.'],
        },
      },
      {
        id: 'kw-registration',
        keywords: { ar: ['تسجيل', 'حساب', 'دخول', 'otp'], en: ['register', 'signup', 'login', 'account', 'otp'] },
        answers: {
          ar: ['التسجيل من /auth يتطلب الاسم والبريد والهاتف وكلمة المرور وتأكيد OTP. بعد التسجيل يمكنك استئناف الإجراء الذي بدأته.'],
          en: ['Register at /auth with name, email, phone, password, and OTP confirmation. After signup you can resume the action you started.'],
        },
      },
      {
        id: 'kw-subscription',
        keywords: { ar: ['اشتراك', 'مجتمع', 'مشترك'], en: ['subscription', 'community', 'subscribe', 'subscriber'] },
        answers: {
          ar: ['اشتراك المجتمع يفتح المحتوى المقفول والمحادثة الجماعية والمونوغرافيا. تصفح الخطط من /subscriptions.'],
          en: ['Community subscription unlocks locked content, group chat, and monographs. View plans at /subscriptions.'],
        },
      },
      {
        id: 'kw-booking',
        keywords: { ar: ['حجز', 'موعد', 'استشارة', 'عيادة', 'رحلة', 'شراء'], en: ['book', 'booking', 'appointment', 'consultation', 'clinic', 'trip', 'purchase', 'buy'] },
        answers: {
          ar: ['للحجز أو الشراء: سجّل الدخول، اختر الخدمة (استشارة/عيادة/رحلة/دورة/كتاب)، راجع التفاصيل، ثم ادفع من صفحة الدفع.'],
          en: ['To book or purchase: sign in, choose the service (consultation/clinic/trip/course/book), review details, then pay on checkout.'],
        },
      },
      {
        id: 'kw-locked',
        keywords: { ar: ['مقفول', 'محتوى حصري', 'مشتركين'], en: ['locked', 'exclusive', 'subscriber only', 'premium'] },
        answers: {
          ar: ['المحتوى المقفول يتطلب اشتراكاً فعّالاً. يمكنك التصفح كزائر، لكن الفتح يحتاج اشتراكاً من /subscriptions.'],
          en: ['Locked content requires an active subscription. You can browse as a guest, but opening it needs a plan from /subscriptions.'],
        },
      },
    ],
  };
}

export function getAssistantConfig(): AssistantConfig {
  const stored = readLocalStorageJson<AssistantConfig | null>(ASSISTANT_CONFIG_KEY, null);
  if (stored) {
    return {
      ...getDefaultAssistantConfig(),
      ...stored,
      outOfScopeMessage: stored.outOfScopeMessage ?? getDefaultAssistantConfig().outOfScopeMessage,
      healthDisclaimer: stored.healthDisclaimer ?? getDefaultAssistantConfig().healthDisclaimer,
    };
  }
  const seeded = getDefaultAssistantConfig();
  writeLocalStorageJson(ASSISTANT_CONFIG_KEY, seeded);
  return seeded;
}

export function saveAssistantConfig(config: AssistantConfig) {
  writeLocalStorageJson(ASSISTANT_CONFIG_KEY, config);
}

export function isAssistantEnabled(): boolean {
  return getAssistantConfig().enabled;
}

export function normalizeAssistantInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function hashAssistantInput(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function keywordMatches(normalizedInput: string, keyword: string): boolean {
  const normalizedKeyword = normalizeAssistantInput(keyword);
  if (!normalizedKeyword) return false;
  return normalizedInput.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedInput);
}

export function isHealthRelatedInput(input: string): boolean {
  const normalized = normalizeAssistantInput(input);
  return HEALTH_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function matchKeyword(input: string, language: AssistantLanguage): string | null {
  const normalizedInput = normalizeAssistantInput(input);
  if (!normalizedInput) return null;

  const config = getAssistantConfig();
  const lang = language === 'ar' ? 'ar' : 'en';
  const matches = config.keywords.filter((entry) =>
    (entry.keywords[lang] || []).some((keyword) => keywordMatches(normalizedInput, keyword)),
  );

  if (matches.length === 0) return null;

  const entry = matches[hashAssistantInput(normalizedInput) % matches.length];
  const answers = entry.answers[lang]?.length ? entry.answers[lang] : entry.answers.en;
  if (!answers?.length) return null;

  return answers[hashAssistantInput(`${normalizedInput}:${entry.id}`) % answers.length];
}

export function resolveAssistantReply(input: string, language: AssistantLanguage): string {
  const config = getAssistantConfig();
  const lang = language === 'ar' ? 'ar' : 'en';

  if (isHealthRelatedInput(input)) {
    return config.healthDisclaimer[lang] ?? config.healthDisclaimer.en;
  }

  const matched = matchKeyword(input, lang);
  if (matched) return matched;

  return config.outOfScopeMessage[lang] ?? config.outOfScopeMessage.en;
}
