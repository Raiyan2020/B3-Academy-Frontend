'use client';

import { Lock, MessageCircle, MoveLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../../LanguageContext';
import { useAuth } from '@/features/auth/auth-provider';
import { getActiveCommunitySections } from '@/features/community/services/community-sections.service';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';

export function CommunityHomePage() {
  const { language, localize } = useLanguage();
  const { user } = useAuth();
  const sections = getActiveCommunitySections();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{language === 'ar' ? 'المجتمع' : 'Community'}</p>
          <h1 className="max-w-3xl text-4xl font-bold text-slate-950">
            {language === 'ar' ? 'أقسام المجتمع في مكان واحد' : 'Community sections in one place'}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {language === 'ar'
              ? 'هذه الصفحة تعرض مداخل الأقسام فقط. المحتوى العام متاح للتصفح، والمحتوى المقفول يحتاج إلى اشتراك فعّال.'
              : 'This page only introduces the community sections. Public content can be browsed freely, while locked content needs an active subscription.'}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {sections.map((section) => {
          const locked = section.accessLevel === 'subscriber' && !isSubscriptionActive(user);
          return (
            <Link
              key={section.id}
              href={section.href}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <MessageCircle className="h-7 w-7 text-emerald-700" />
                {locked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <Lock className="h-3.5 w-3.5" />
                    {language === 'ar' ? 'اشتراك' : 'Subscription'}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-950">{localize(section.title)}</h2>
              <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{localize(section.description)}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                {language === 'ar' ? 'فتح القسم' : 'Open section'}
                <MoveLeft className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

