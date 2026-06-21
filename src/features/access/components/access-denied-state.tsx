'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, LogIn, CreditCard, BookOpen, Stethoscope } from 'lucide-react';

export type AccessDeniedVariant =
  | 'login_required'
  | 'purchase_required'
  | 'subscription_required'
  | 'ownership_required'
  | 'initial_consultation_required';

interface AccessDeniedStateProps {
  variant: AccessDeniedVariant;
  /** The href to navigate to for the primary CTA */
  ctaHref?: string;
  /** Override the CTA label */
  ctaLabel?: string;
  /** Extra context shown as a subtitle */
  description?: string;
  isAr?: boolean;
}

const CONFIG: Record<
  AccessDeniedVariant,
  {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    title: { ar: string; en: string };
    subtitle: { ar: string; en: string };
    defaultCta: { ar: string; en: string };
    defaultHref: string;
  }
> = {
  login_required: {
    icon: LogIn,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: { ar: 'تسجيل الدخول مطلوب', en: 'Login Required' },
    subtitle: { ar: 'يجب تسجيل الدخول للوصول إلى هذا المحتوى.', en: 'You must be logged in to access this content.' },
    defaultCta: { ar: 'تسجيل الدخول / إنشاء حساب', en: 'Login / Register' },
    defaultHref: '/auth',
  },
  purchase_required: {
    icon: CreditCard,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    title: { ar: 'يتطلب الشراء', en: 'Purchase Required' },
    subtitle: { ar: 'يجب شراء هذا المحتوى للوصول إليه.', en: 'This content must be purchased to access.' },
    defaultCta: { ar: 'عرض التفاصيل', en: 'View Details' },
    defaultHref: '/',
  },
  subscription_required: {
    icon: BookOpen,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
    title: { ar: 'محتوى حصري للمشتركين', en: 'Subscribers Only' },
    subtitle: { ar: 'هذا المحتوى متاح للمشتركين النشطين فقط. اشترك الآن للوصول إليه.', en: 'This content is available to active subscribers only. Subscribe now to access.' },
    defaultCta: { ar: 'عرض خطط الاشتراك', en: 'View Subscription Plans' },
    defaultHref: '/subscriptions',
  },
  ownership_required: {
    icon: Lock,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    title: { ar: 'غير مملوك', en: 'Not Owned' },
    subtitle: { ar: 'لا تملك صلاحية الوصول إلى هذا المحتوى.', en: 'You do not have access to this content.' },
    defaultCta: { ar: 'العودة', en: 'Go Back' },
    defaultHref: '/',
  },
  initial_consultation_required: {
    icon: Stethoscope,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    title: { ar: 'مطلوب استشارة أولية', en: 'Initial Consultation Required' },
    subtitle: { ar: 'يجب إجراء استشارة أولية مع الطبيب المسؤول قبل إتمام هذا الإجراء.', en: 'An initial consultation with the responsible specialist is required before proceeding.' },
    defaultCta: { ar: 'احجز استشارة أولية', en: 'Book Initial Consultation' },
    defaultHref: '/consultations',
  },
};

export function AccessDeniedState({
  variant,
  ctaHref,
  ctaLabel,
  description,
  isAr = false,
}: AccessDeniedStateProps) {
  const cfg = CONFIG[variant];
  const { icon: Icon, iconBg, iconColor, title, subtitle, defaultCta, defaultHref } = cfg;
  const label = ctaLabel ?? (isAr ? defaultCta.ar : defaultCta.en);
  const href = ctaHref ?? defaultHref;

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full ${iconBg}`}>
        <Icon className={`h-8 w-8 ${iconColor}`} />
      </div>
      <h2 className="mb-2 text-xl font-bold text-slate-900">
        {isAr ? title.ar : title.en}
      </h2>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
        {description ?? (isAr ? subtitle.ar : subtitle.en)}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
      >
        {label}
      </Link>
    </div>
  );
}
