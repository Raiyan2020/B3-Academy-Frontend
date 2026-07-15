'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import { useFeaturedTrips, useTrips } from '../hooks/use-trips-api';
import type { TripPackageListItem } from '../types/api.types';

export function TripsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user, requireAuthAction } = useAuth();
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [place, setPlace] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSeats, setMinSeats] = useState('');
  const [duration, setDuration] = useState('all');

  const tripsQuery = useTrips();
  const featuredQuery = useFeaturedTrips();
  const trips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data]);
  const featured = featuredQuery.data ?? [];

  const places = useMemo(
    () => Array.from(new Set(trips.map((trip) => trip.location).filter(Boolean))),
    [trips],
  );
  const durations = useMemo(
    () => Array.from(new Set(trips.map((trip) => trip.duration).filter(Boolean))),
    [trips],
  );
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    trips.forEach((trip) => {
      if (trip.category) map.set(trip.category.id, trip.category.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [trips]);

  const filtered = useMemo(() => {
    return trips.filter((trip) => {
      const byName = trip.name.toLowerCase().includes(query.trim().toLowerCase());
      const byCategory = category === 'all' || trip.category?.id === category;
      const byPlace = place === 'all' || trip.location === place;
      const byPrice = !maxPrice || trip.price <= Number(maxPrice);
      const bySeats = !minSeats || (trip.remainingSpots ?? Infinity) >= Number(minSeats);
      const byDuration = duration === 'all' || trip.duration === duration;
      return byName && byCategory && byPlace && byPrice && bySeats && byDuration;
    });
  }, [category, duration, maxPrice, minSeats, place, query, trips]);

  const handleDirectPurchase = (trip: TripPackageListItem) => {
    const initialHref = `/trips/${trip.id}/initial-consultation`;
    const checkoutHref = `/checkout/trip-package/${trip.id}`;
    // A trip is purchasable directly when the IC prerequisite is satisfied (can_purchase)
    // or the package does not require an initial consultation at all.
    const canCheckout = trip.canPurchase || !trip.requiresTripInitialConsultation;
    const destination = canCheckout ? checkoutHref : initialHref;

    if (!user) {
      savePendingIntent({
        type: canCheckout ? 'trip.checkout' : 'trip.initial-consultation',
        href: destination,
        returnUrl: `/trips/${trip.id}`,
        label: trip.name,
        tripId: trip.id,
        itemId: trip.id,
        itemKind: 'trip',
      });
    }
    if (!requireAuthAction()) return;

    if (trip.isPurchased || trip.isFullyBooked) return;
    router.push(destination);
  };

  const isLoading = tripsQuery.isLoading;
  const isError = tripsQuery.isError;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{isAr ? 'الرحلات' : 'Trips'}</p>
          <h1 className="text-4xl font-bold text-slate-950">{isAr ? 'باقات الرحلات المتاحة' : 'Available trip packages'}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {isAr
              ? 'شراء باقة رحلة يتطلب تسجيل الدخول وإتمام الاستشارة الأولية العامة الخاصة بالرحلات، ويتم تنفيذ الرحلة لاحقاً بالتنسيق مع الإدارة.'
              : 'Buying a trip package requires login and completing the general trip initial consultation. Execution is coordinated later by administration.'}
          </p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-bold text-slate-950">{isAr ? 'رحلات مميزة' : 'Featured trips'}</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {featured.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                formatPrice={formatPrice}
                isAr={isAr}
                onPurchase={() => handleDirectPurchase(trip)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-6">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isAr ? 'بحث باسم الباقة' : 'Search package name'} className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="all">{isAr ? 'كل التصنيفات' : 'All categories'}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select value={place} onChange={(e) => setPlace(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="all">{isAr ? 'كل الأماكن' : 'All places'}</option>
            {places.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={duration} onChange={(e) => setDuration(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="all">{isAr ? 'كل المدد' : 'All durations'}</option>
            {durations.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={isAr ? 'السعر حتى' : 'Max price'} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="number" value={minSeats} onChange={(e) => setMinSeats(e.target.value)} placeholder={isAr ? 'مقاعد متاحة من' : 'Min seats'} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">{isAr ? 'جاري تحميل الرحلات...' : 'Loading trips...'}</div>
        ) : isError ? (
          <div className="rounded-lg border border-dashed border-red-300 bg-white p-10 text-center text-red-600">{isAr ? 'تعذر تحميل الرحلات.' : 'Failed to load trips.'}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">{isAr ? 'لا توجد رحلات مطابقة.' : 'No matching trips.'}</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                formatPrice={formatPrice}
                isAr={isAr}
                onPurchase={() => handleDirectPurchase(trip)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function TripCard({
  trip,
  formatPrice,
  isAr,
  onPurchase,
}: {
  trip: TripPackageListItem;
  formatPrice: (price: number) => string;
  isAr: boolean;
  onPurchase: () => void;
}) {
  const soldOut = trip.isFullyBooked;
  const alreadyPurchased = trip.isPurchased;
  const canBuy = !alreadyPurchased && !soldOut;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <Link href={`/trips/${trip.id}`}>
        {trip.image && <img src={trip.image} alt={trip.name} className="h-56 w-full object-cover" />}
      </Link>
      <div className="p-5">
        <div className="mb-2 flex flex-wrap gap-2">
          {trip.category && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              {trip.category.name}
            </span>
          )}
          {trip.location && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{trip.location}</span>}
        </div>
        <Link href={`/trips/${trip.id}`}>
          <h2 className="text-xl font-bold text-slate-950 hover:text-emerald-700">{trip.name}</h2>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{trip.shortDescription}</p>
        <ul className="mt-3 space-y-1">
          {trip.features.slice(0, 3).map((feature, index) => (
            <li key={`${feature}-${index}`} className="text-xs text-slate-600">• {feature}</li>
          ))}
        </ul>
        <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
          {trip.duration && <span>{trip.duration}</span>}
          {trip.remainingSpots != null && <span>{trip.remainingSpots} {isAr ? 'مقاعد' : 'seats'}</span>}
          <span className="font-bold text-emerald-700">{formatPrice(trip.price)}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href={`/trips/${trip.id}`} className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {isAr ? 'التفاصيل' : 'Details'}
          </Link>
          <button
            type="button"
            onClick={onPurchase}
            disabled={!canBuy}
            className="flex-1 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {alreadyPurchased
              ? (isAr ? 'تم الشراء' : 'Purchased')
              : soldOut
                ? (isAr ? 'نفدت المقاعد' : 'Sold out')
                : (isAr ? 'شراء الباقة' : 'Buy package')}
          </button>
        </div>
      </div>
    </article>
  );
}

export { TripsPage as Trips };
