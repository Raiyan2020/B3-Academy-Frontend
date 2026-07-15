'use client';

import { Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { useGlobalSearch } from '@/features/search/hooks/use-global-search';
import { resolveSearchItemRoute, type SearchGroupDto, type SearchItemDto } from '@/features/search/types/search.types';

export function SearchPage() {
  const params = useSearchParams();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [query, setQuery] = useState(params.get('q') || '');

  const { data, isFetching, isError, error, isEnabled, isTermTooShort } = useGlobalSearch(query);

  const groups = data?.groups ?? [];
  const hasResults = groups.some((group) => group.items.length > 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-950">{isAr ? 'البحث في المنصة' : 'Search the platform'}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {isAr
              ? 'ابحث نصياً في الدورات والكتب والموسوعة والمجتمع والأسئلة الشائعة. لا توجد فلاتر إضافية في البحث العام.'
              : 'Search courses, books, encyclopedia, community, and FAQ. Global search has no extra filters.'}
          </p>
          <div className="mt-6 flex max-w-2xl items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={isAr ? 'اكتب كلمة البحث' : 'Type your search'}
              className="w-full border-0 bg-transparent text-base outline-none"
            />
            {isFetching ? <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> : null}
          </div>
          {isEnabled && data ? (
            <p className="mt-3 text-sm text-slate-500">
              {isAr
                ? `${data.total_results} نتيجة عن "${data.query}"`
                : `${data.total_results} result${data.total_results === 1 ? '' : 's'} for "${data.query}"`}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {renderBody()}
      </section>
    </main>
  );

  function renderBody() {
    if (!query.trim() || isTermTooShort) {
      return (
        <EmptyState
          text={
            isAr
              ? 'اكتب حرفين على الأقل لعرض النتائج.'
              : 'Enter at least 2 characters to see results.'
          }
        />
      );
    }

    if (isError) {
      return (
        <EmptyState
          tone="error"
          text={
            isAr
              ? 'تعذر تحميل نتائج البحث. حاول مرة أخرى.'
              : (error instanceof Error && error.message) || 'Could not load search results. Please try again.'
          }
        />
      );
    }

    if (isFetching && !data) {
      return (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
          {isAr ? 'جارٍ البحث…' : 'Searching…'}
        </div>
      );
    }

    if (!hasResults) {
      return <EmptyState text={isAr ? 'لا توجد نتائج مطابقة.' : 'No matching results.'} />;
    }

    return (
      <div className="space-y-8">
        {groups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <SearchGroup key={group.key} group={group} isAr={isAr} />
          ))}
      </div>
    );
  }
}

function SearchGroup({ group, isAr }: { group: SearchGroupDto; isAr: boolean }) {
  return (
    <div>
      <div className="mb-4 flex items-baseline gap-2">
        <h2 className="text-xl font-bold text-slate-950">{group.label || group.key}</h2>
        <span className="text-sm text-slate-500">({group.count})</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {group.items.map((item) => (
          <SearchResultCard key={`${item.type}-${item.id}`} item={item} groupKey={group.key} isAr={isAr} />
        ))}
      </div>
    </div>
  );
}

function SearchResultCard({ item, groupKey, isAr }: { item: SearchItemDto; groupKey: string; isAr: boolean }) {
  const href = resolveSearchItemRoute(item, groupKey);

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-slate-950">{item.title}</h3>
        {item.requires_subscription ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            {isAr ? 'اشتراك' : 'Subscription'}
          </span>
        ) : null}
      </div>
      {item.description ? (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
      ) : null}
    </>
  );

  const className =
    'block rounded-lg border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm';

  if (!href) {
    return <div className={className}>{inner}</div>;
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

function EmptyState({ text, tone = 'default' }: { text: string; tone?: 'default' | 'error' }) {
  const toneClass =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-slate-300 bg-white text-slate-600';
  return <div className={`rounded-lg border border-dashed p-10 text-center ${toneClass}`}>{text}</div>;
}
