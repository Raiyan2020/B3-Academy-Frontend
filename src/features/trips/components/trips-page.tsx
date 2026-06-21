'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { getActiveTripPackages } from '@/features/care/services/care-data.service';

export function TripsPage() {
  const { localize, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSeats, setMinSeats] = useState('');
  const [maxDays, setMaxDays] = useState('');
  const trips = getActiveTripPackages();
  const categories = Array.from(new Set(trips.map((trip) => trip.category)));

  const filtered = useMemo(() => {
    return trips.filter((trip) => {
      const byName = localize(trip.title).toLowerCase().includes(query.trim().toLowerCase());
      const byCategory = category === 'all' || trip.category === category;
      const byPrice = !maxPrice || trip.price <= Number(maxPrice);
      const bySeats = !minSeats || trip.availableSeats >= Number(minSeats);
      const byDays = !maxDays || trip.durationDays <= Number(maxDays);
      return byName && byCategory && byPrice && bySeats && byDays;
    });
  }, [category, localize, maxDays, maxPrice, minSeats, query, trips]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{language === 'ar' ? 'الرحلات' : 'Trips'}</p>
          <h1 className="text-4xl font-bold text-slate-950">{language === 'ar' ? 'باقات الرحلات المتاحة' : 'Available trip packages'}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {language === 'ar'
              ? 'شراء باقة رحلة يتطلب تسجيل الدخول وإتمام الاستشارة الأولية العامة الخاصة بالرحلات، ويتم تنفيذ الرحلة لاحقاً بالتنسيق مع الإدارة.'
              : 'Buying a trip package requires login and completing the general trip initial consultation. Execution is coordinated later by administration.'}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={language === 'ar' ? 'بحث باسم الباقة' : 'Search package name'} className="rounded-md border border-slate-300 px-3 py-2" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="all">{language === 'ar' ? 'كل التصنيفات' : 'All categories'}</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={language === 'ar' ? 'السعر حتى' : 'Max price'} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="number" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} placeholder={language === 'ar' ? 'المدة حتى' : 'Max days'} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="number" value={minSeats} onChange={(e) => setMinSeats(e.target.value)} placeholder={language === 'ar' ? 'مقاعد متاحة من' : 'Min seats'} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">{language === 'ar' ? 'لا توجد رحلات مطابقة.' : 'No matching trips.'}</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                <img src={trip.image} alt={localize(trip.title)} className="h-56 w-full object-cover" />
                <div className="p-5">
                  <h2 className="text-xl font-bold text-slate-950">{localize(trip.title)}</h2>
                  <p className="mt-2 text-sm text-slate-600">{localize(trip.description)}</p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                    <span>{localize(trip.place)}</span>
                    <span>{trip.durationDays} {language === 'ar' ? 'أيام' : 'days'}</span>
                    <span>{trip.availableSeats} {language === 'ar' ? 'مقاعد' : 'seats'}</span>
                  </div>
                  <p className="mt-4 text-lg font-bold text-emerald-700">${trip.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export { TripsPage as Trips };

