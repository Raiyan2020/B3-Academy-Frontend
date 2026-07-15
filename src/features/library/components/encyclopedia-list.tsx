'use client';

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { ChevronDown } from 'lucide-react';
import { Link } from '@/lib/routing/next-router-compat';
import {
  getEditorPicks,
  getHerbFilterOptions,
  getHerbLibrary,
  getLatestNews,
  searchNews,
} from '@/features/library/services/encyclopedia.service';
import type { EncyclopediaHerbFilters, EncyclopediaHerbItem, EncyclopediaNewsItem } from '@/features/library/types/encyclopedia.types';
import { useApiEncyclopediaItems, useApiHerbalFilters, useApiNewsTypes } from '../hooks/use-encyclopedia-api';
import type { HerbalApiFilters } from '../services/encyclopedia-api.service';

export const Encyclopedia: React.FC = () => {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';

  const [filters, setFilters] = useState<EncyclopediaHerbFilters>({ search: '' });
  const [apiFilters, setApiFilters] = useState<HerbalApiFilters>({});
  const [newsSearch, setNewsSearch] = useState('');
  const [newsTypeId, setNewsTypeId] = useState('');
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const apiItems = useApiEncyclopediaItems(newsSearch, { ...apiFilters, search: filters.search }, newsTypeId);
  const apiFilterOptions = useApiHerbalFilters();
  const newsTypes = useApiNewsTypes();
  const backendNews = apiItems.data?.filter((item): item is EncyclopediaNewsItem => item.kind === 'news') ?? [];
  const backendHerbs = apiItems.data?.filter((item): item is EncyclopediaHerbItem => item.kind === 'herb') ?? [];

  const latestNews = backendNews.length ? backendNews : newsSearch.trim() ? searchNews(newsSearch) : getLatestNews(3);
  const editorsPicks = backendHerbs.length ? backendHerbs.slice(0, 4) : getEditorPicks();
  const herbLibrary = backendHerbs.length ? backendHerbs : getHerbLibrary(filters);

  const filterDimensions = [
    { key: 'familyId' as const, label: isAr ? 'بحث حسب الفصيلة' : 'Search by family', options: apiFilterOptions.data?.families ?? [] },
    { key: 'speciesId' as const, label: isAr ? 'بحث حسب النوع' : 'Search by species', options: apiFilterOptions.data?.species ?? [] },
    { key: 'genusId' as const, label: isAr ? 'بحث حسب الجنس' : 'Search by genus', options: apiFilterOptions.data?.genera ?? [] },
    { key: 'originId' as const, label: isAr ? 'بحث حسب الأصل' : 'Search by origin', options: apiFilterOptions.data?.origins ?? [] },
  ];

  const setApiFilterValue = (key: keyof HerbalApiFilters, value: string) => {
    setApiFilters((current) => ({ ...current, [key]: value || undefined }));
    setOpenFilter(null);
  };

  const resetFilters = () => {
    setFilters({ search: '' });
    setApiFilters({});
  };

  const hasActiveFilters = Boolean(Object.values(apiFilters).some(Boolean) || filters.search);

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans text-slate-900" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Education encyclopedia (1.8.11/1.8.12). Community plants/fungi live at /monograph (1.10.7/1.10.8, Phase 6). */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-4xl font-bold text-[#4a634a]">
            {isAr ? 'آخر الأخبار في طب الأعشاب' : 'Latest news in herbal medicine'}
          </h2>
          <div className="flex w-full max-w-xl gap-2 sm:w-auto">
            <select
              value={newsTypeId}
              onChange={(event) => setNewsTypeId(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
            >
              <option value="">{isAr ? 'كل أنواع الأخبار' : 'All news types'}</option>
              {(newsTypes.data || []).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
            <input
              type="search"
              value={newsSearch}
              onChange={(e) => setNewsSearch(e.target.value)}
              placeholder={isAr ? 'ابحث في الأخبار...' : 'Search news...'}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 sm:w-72"
            />
          </div>
        </div>

        {latestNews.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Link
              to={`/encyclopedia/${latestNews[0].id}`}
              className="group relative h-[500px] overflow-hidden rounded-3xl shadow-lg lg:col-span-2"
            >
              <img
                src={latestNews[0].image}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt=""
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-emerald-950/80 to-transparent p-8">
                <span className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-200">
                  {localize(latestNews[0].category)}
                </span>
                <h3 className="mb-2 text-2xl font-bold leading-snug text-white">{localize(latestNews[0].title)}</h3>
                <p className="line-clamp-2 max-w-2xl text-sm text-emerald-50 opacity-80">{localize(latestNews[0].summary)}</p>
              </div>
            </Link>

            <div className="flex flex-col gap-6">
              {latestNews.slice(1).map((news) => (
                <Link
                  key={news.id}
                  to={`/encyclopedia/${news.id}`}
                  className="group relative h-[238px] overflow-hidden rounded-3xl shadow-md"
                >
                  <img src={news.image} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-emerald-950/80 to-transparent p-6">
                    <h3 className="text-lg font-bold leading-tight text-white">{localize(news.title)}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            {isAr ? 'لا توجد أخبار مطابقة.' : 'No matching news items.'}
          </p>
        )}
      </section>

      <section className="bg-[#ede3ce]/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-4xl font-bold text-[#4a634a]">{isAr ? 'اختيارات المحرر' : "Editor's pick"}</h2>

          {editorsPicks.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {editorsPicks.map((pick) => (
                <Link key={pick.id} to={`/encyclopedia/${pick.id}`} className="group">
                  <div className="mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-white shadow-sm">
                    <img src={pick.image} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                  </div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#006254]">
                    {pick.kind === 'news' ? localize(pick.category) : pick.kind === 'herb' ? localize(pick.herbType) : ''}
                  </p>
                  <h3 className="mb-2 text-lg font-bold leading-tight text-slate-800 transition-colors group-hover:text-[#006254]">
                    {localize(pick.title)}
                  </h3>
                  <p className="line-clamp-2 text-xs italic text-slate-500">{localize(pick.summary)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500">{isAr ? 'لا توجد اختيارات محرر حالياً.' : 'No editor picks configured.'}</p>
          )}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-4xl font-bold text-[#4a634a]">
            {isAr ? 'استكشف مكتبة الأعشاب لدينا' : 'Explore our herb library'}
          </h2>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3">
              {herbLibrary.length > 0 ? (
                <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-6">
                  {herbLibrary.map((herb) => (
                    <Link
                      key={herb.id}
                      to={`/encyclopedia/${herb.id}`}
                      className="group relative h-[450px] w-72 flex-none snap-start overflow-hidden rounded-3xl shadow-lg"
                    >
                      <img src={herb.image} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                      <div className="absolute inset-x-0 bottom-20 mx-4 rounded-xl bg-[#006254]/80 px-4 py-2 text-center backdrop-blur-sm">
                        <span className="text-sm font-bold uppercase tracking-widest text-white">{localize(herb.title)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                  {isAr ? 'لا توجد أعشاب تطابق عوامل التصفية.' : 'No herbs match your filters.'}
                </div>
              )}
            </div>

            <div className="flex h-full flex-col justify-center gap-6 rounded-3xl bg-[#006254] p-8 text-white shadow-xl">
              <h4 className="mb-4 font-serif text-xl font-bold italic">
                {isAr ? 'اكتشف جميع أعشابنا' : 'Discover all our herbs'}
              </h4>

              <input
                type="search"
                value={filters.search ?? ''}
                onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))}
                placeholder={isAr ? 'ابحث بالاسم...' : 'Search by name...'}
                className="w-full rounded-2xl border border-white/10 bg-emerald-400/10 px-4 py-3 text-sm text-white placeholder:text-emerald-100/60 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />

              <div className="space-y-4">
                {filterDimensions.map(({ key, label, options }) => (
                  <div key={key} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenFilter(openFilter === key ? null : key)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-emerald-400/10 px-6 py-4 text-start text-sm font-medium transition-all hover:bg-emerald-400/20"
                    >
                      <span>
                        {label}
                        {apiFilters[key] ? `: ${options.find((option) => option.id === apiFilters[key])?.name || ''}` : ''}
                      </span>
                      <ChevronDown size={16} className={openFilter === key ? 'rotate-180' : ''} />
                    </button>
                    {openFilter === key && (
                      <div className="absolute z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#004d42] shadow-xl">
                        <button
                          type="button"
                          onClick={() => setApiFilterValue(key, '')}
                          className="block w-full px-4 py-2 text-start text-sm hover:bg-emerald-400/20"
                        >
                          {isAr ? 'الكل' : 'All'}
                        </button>
                        {(options.length ? options : getHerbFilterOptions(
                          key === 'familyId' ? 'family' : key === 'originId' ? 'origin' : key === 'speciesId' ? 'type' : 'sex',
                        ).map((name) => ({ id: name, name }))).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setApiFilterValue(key, option.id)}
                            className="block w-full px-4 py-2 text-start text-sm hover:bg-emerald-400/20"
                          >
                            {option.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                >
                  {isAr ? 'إعادة تعيين الفلاتر' : 'Reset filters'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export { Encyclopedia as EncyclopediaList };
