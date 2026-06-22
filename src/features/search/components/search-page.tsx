'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { groupSearchResults, searchSite } from '@/features/search/services/search-index.service';

const kindLabels: Record<string, { ar: string; en: string }> = {
  course: { ar: 'الدورات', en: 'Courses' },
  book: { ar: 'الكتب', en: 'Books' },
  encyclopedia: { ar: 'الموسوعة', en: 'Encyclopedia' },
  'community-section': { ar: 'المجتمع', en: 'Community' },
  blog: { ar: 'المقالات', en: 'Articles' },
  theory: { ar: 'النظريات', en: 'Theories' },
  research: { ar: 'الأبحاث', en: 'Research' },
  podcast: { ar: 'البودكاست', en: 'Podcasts' },
  clinic: { ar: 'العيادات', en: 'Clinics' },
  consultation: { ar: 'الاستشارات', en: 'Consultations' },
  trip: { ar: 'الرحلات', en: 'Trips' },
  faq: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
  subscription: { ar: 'الاشتراكات', en: 'Subscriptions' },
  monograph: { ar: 'المونوغرافيا', en: 'Monographs' },
};

export function SearchPage() {
  const params = useSearchParams();
  const { language, localize } = useLanguage();
  const [query, setQuery] = useState(params.get('q') || '');
  const results = useMemo(() => searchSite(query), [query]);
  const grouped = useMemo(() => groupSearchResults(results), [results]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-950">{language === 'ar' ? 'البحث في المنصة' : 'Search the platform'}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {language === 'ar'
              ? 'ابحث نصياً في الدورات والكتب والموسوعة والمجتمع والأسئلة الشائعة والاشتراكات والمونوغرافيا. لا توجد فلاتر إضافية في البحث العام.'
              : 'Search courses, books, encyclopedia, community, FAQ, subscriptions, and monographs. Global search has no extra filters.'}
          </p>
          <div className="mt-6 flex max-w-2xl items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={language === 'ar' ? 'اكتب كلمة البحث' : 'Type your search'}
              className="w-full border-0 bg-transparent text-base outline-none"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!query.trim() ? (
          <EmptyState text={language === 'ar' ? 'اكتب كلمة بحث لعرض النتائج.' : 'Enter a search term to see results.'} />
        ) : results.length === 0 ? (
          <EmptyState text={language === 'ar' ? 'لا توجد نتائج مطابقة.' : 'No matching results.'} />
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([kind, items]) => (
              <div key={kind}>
                <h2 className="mb-4 text-xl font-bold text-slate-950">{kindLabels[kind]?.[language === 'ar' ? 'ar' : 'en'] || kind}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((item) => (
                    <Link key={`${item.kind}-${item.id}`} href={item.href} className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm">
                      <h3 className="font-bold text-slate-950">{localize(item.title)}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{localize(item.description)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">{text}</div>;
}

