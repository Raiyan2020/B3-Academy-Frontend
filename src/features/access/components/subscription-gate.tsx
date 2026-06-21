'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';

export function SubscriptionGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();
  const { language } = useLanguage();

  if (user?.isSubscribed) return <>{children}</>;

  return (
    <>
      {fallback || (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">{language === 'ar' ? 'يتطلب اشتراكاً فعّالاً' : 'Active subscription required'}</p>
          <Link href="/subscriptions" className="mt-3 inline-flex rounded-md bg-emerald-700 px-3 py-2 font-semibold text-white">
            {language === 'ar' ? 'تصفح الاشتراكات' : 'View subscriptions'}
          </Link>
        </div>
      )}
    </>
  );
}
