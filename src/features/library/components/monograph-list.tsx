'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { Link } from '@/lib/routing/next-router-compat';
import { Search, Leaf, Filter, BookOpen } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { canAccessMonograph, getMonographCategories, getMonographs } from '@/features/library/services/monograph.service';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';

export const Monograph: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const isAr = language === 'ar';

  const categories = useMemo(() => getMonographCategories(), []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 py-24">
        <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
          <AccessDeniedState variant="login_required" isAr={isAr} />
        </div>
      </div>
    );
  }

  if (!isSubscriptionActive(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 py-24">
        <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
          <AccessDeniedState variant="subscription_required" isAr={isAr} />
        </div>
      </div>
    );
  }

  const filteredMonographs = getMonographs({
    search: searchTerm,
    category: filterCategory,
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            <BookOpen size={16} /> {isAr ? 'محتوى مميز' : 'Premium Content'}
          </div>
          <h1 className="mb-4 text-3xl font-bold text-slate-800 md:text-4xl">
            {isAr ? 'موسوعة النباتات والفطر' : 'Plants & Fungi Monograph'}
          </h1>
        </div>

        <div className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={isAr ? 'ابحث بالاسم العربي أو الإنجليزي أو العلمي...' : 'Search Arabic, English, or scientific name...'}
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400" size={20} />
            <select
              className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">{isAr ? 'كل التصنيفات' : 'All Categories'}</option>
              {categories.map((category) => (
                <option key={category.en} value={category.en}>
                  {isAr ? category.ar : category.en}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
          {filteredMonographs.map((item) => (
            <Link
              key={item.id}
              to={`/monograph/${item.id}`}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-200 hover:shadow-md sm:flex-row"
            >
              <div className="h-48 overflow-hidden sm:h-auto sm:w-2/5">
                <img
                  src={item.imageUrl}
                  alt={item.name.en}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col p-6 sm:w-3/5">
                <h3 className="text-xl font-bold text-slate-800">{isAr ? item.name.ar : item.name.en}</h3>
                <p className="mt-1 text-sm italic text-slate-500">{item.scientificName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-block rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    {isAr ? item.category.ar : item.category.en}
                  </span>
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                      item.type === 'Fungi' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <p className="mb-4 mt-3 line-clamp-3 flex-1 text-sm text-slate-600">
                  {isAr ? item.description.ar : item.description.en}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {filteredMonographs.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <Leaf className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="mb-1 text-lg font-medium text-slate-900">{isAr ? 'لا توجد نتائج' : 'No results found'}</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export { Monograph as MonographList };
