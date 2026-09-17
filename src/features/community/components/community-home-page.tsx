'use client';

import { Lock, MessageCircle, MoveLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/LanguageContext';
import { useCommunitySections } from '@/features/community/hooks/use-community-sections';

export function CommunityHomePage() {
  const { language } = useLanguage();
  const { data, isLoading, isError } = useCommunitySections();
  const sections = data || [];
  const isAr = language === 'ar';

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{isAr ? 'المجتمع' : 'Community'}</p>
          <h1 className="max-w-3xl text-4xl font-bold text-slate-950">
            {isAr ? 'أقسام المجتمع في مكان واحد' : 'Community sections in one place'}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {isAr
              ? 'هذه الصفحة تعرض مداخل الأقسام فقط. المحتوى العام متاح للتصفح، والمحتوى المقفول يحتاج إلى اشتراك فعال.'
              : 'This page only introduces the community sections. Public content can be browsed freely, while locked content needs an active subscription.'}
          </p>
        </div>
      </section>

      {sections.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500 sm:px-6 lg:px-8">
          {isLoading
            ? isAr ? 'جار التحميل...' : 'Loading...'
            : isError
              ? isAr ? 'تعذر تحميل أقسام المجتمع. حاول مرة أخرى.' : 'Could not load the community sections. Please try again.'
              : isAr ? 'لا توجد أقسام مفعلة حالياً.' : 'No active sections are available.'}
        </div>
      ) : (
        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {sections.map((section) => (
            <Link
              key={section.key}
              href={section.href}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <MessageCircle className="h-7 w-7 text-emerald-700" />
                {section.requiresSubscription && !section.canAccess && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <Lock className="h-3.5 w-3.5" />
                    {isAr ? 'اشتراك' : 'Subscription'}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-950">{section.name}</h2>
              <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{section.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                {isAr ? 'فتح القسم' : 'Open section'}
                <MoveLeft className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
