'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import {
  getActiveTripPackages,
  getFeaturedTripPackages,
  getTripCategoryLabel,
  getTripPlaces,
} from '@/features/care/services/care-data.service';
import type { TripPackageRecord } from '@/features/care/types/care.types';
import { hasStoredTripPurchase, getStoredConsultations } from '@/features/care/services/care-records-storage.service';
import {
  evaluateTripInitialConsultation,
  isPrerequisiteSatisfied,
} from '@/features/care/services/care-prerequisite.service';
import { getTripAvailableSeats, isTripSoldOut } from '@/features/care/services/trip-capacity.service';

export function TripsPage() {
  const router = useRouter();
  const { localize, language } = useLanguage();
  const { formatPrice, convertPrice } = useCurrency();
  const { user, requireAuthAction } = useAuth();
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [place, setPlace] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSeats, setMinSeats] = useState('');
  const [maxDays, setMaxDays] = useState('');
  const trips = getActiveTripPackages();
  const featured = getFeaturedTripPackages();
  const places = getTripPlaces();
  const categories = Array.from(new Set(trips.map((trip) => trip.category)));

  const filtered = useMemo(() => {
    return trips.filter((trip) => {
      const convertedPrice = convertPrice(trip.price);
      const byName = localize(trip.title).toLowerCase().includes(query.trim().toLowerCase());
      const byCategory = category === 'all' || trip.category === category;
      const byPlace = place === 'all' || trip.place.en === place;
      const byPrice = !maxPrice || convertedPrice <= Number(maxPrice);
      const bySeats = !minSeats || getTripAvailableSeats(trip.id) >= Number(minSeats);
      const byDays = !maxDays || trip.durationDays <= Number(maxDays);
      return byName && byCategory && byPlace && byPrice && bySeats && byDays;
    });
  }, [category, convertPrice, localize, maxDays, maxPrice, minSeats, place, query, trips]);

  const handleDirectPurchase = (trip: TripPackageRecord) => {
    const initialHref = `/trips/${trip.id}/initial-consultation`;
    const checkoutHref = `/checkout/trip-package/${trip.id}`;
    const prerequisiteStatus = user ? evaluateTripInitialConsultation(user.id) : 'missing';
    const prerequisiteComplete = isPrerequisiteSatisfied(prerequisiteStatus);

    if (!user) {
      savePendingIntent({
        type: prerequisiteComplete ? 'trip.checkout' : 'trip.initial-consultation',
        href: prerequisiteComplete ? checkoutHref : initialHref,
        returnUrl: `/trips/${trip.id}`,
        label: localize(trip.title),
        tripId: trip.id,
        itemId: trip.id,
        itemKind: 'trip',
      });
    }
    if (!requireAuthAction()) return;

    const scheduledRecord = getStoredConsultations(user!.id).find(
      (record) =>
        record.serviceKind === 'trip_initial' &&
        (record.status === 'scheduled' || record.status === 'purchased'),
    );

    if (prerequisiteStatus === 'scheduled' && scheduledRecord) {
      router.push(`/consultation/${scheduledRecord.id}`);
      return;
    }
    if (!prerequisiteComplete) {
      router.push(initialHref);
      return;
    }
    if (hasStoredTripPurchase(user!.id, trip.id)) return;
    if (isTripSoldOut(trip.id)) return;
    router.push(checkoutHref);
  };

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
                localize={localize}
                formatPrice={formatPrice}
                isAr={isAr}
                onPurchase={() => handleDirectPurchase(trip)}
                userId={user?.id}
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
              <option key={item} value={item}>{getTripCategoryLabel(item, language as 'en' | 'ar')}</option>
            ))}
          </select>
          <select value={place} onChange={(e) => setPlace(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="all">{isAr ? 'كل الأماكن' : 'All places'}</option>
            {places.map((item) => (
              <option key={item.en} value={item.en}>{localize(item)}</option>
            ))}
          </select>
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={isAr ? 'السعر حتى' : 'Max price'} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="number" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} placeholder={isAr ? 'المدة حتى' : 'Max days'} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="number" value={minSeats} onChange={(e) => setMinSeats(e.target.value)} placeholder={isAr ? 'مقاعد متاحة من' : 'Min seats'} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">{isAr ? 'لا توجد رحلات مطابقة.' : 'No matching trips.'}</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                localize={localize}
                formatPrice={formatPrice}
                isAr={isAr}
                onPurchase={() => handleDirectPurchase(trip)}
                userId={user?.id}
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
  localize,
  formatPrice,
  isAr,
  onPurchase,
  userId,
}: {
  trip: TripPackageRecord;
  localize: (value: { en: string; ar: string }) => string;
  formatPrice: (price: number) => string;
  isAr: boolean;
  onPurchase: () => void;
  userId?: string;
}) {
  const availableSeats = getTripAvailableSeats(trip.id);
  const soldOut = isTripSoldOut(trip.id);
  const alreadyPurchased = Boolean(userId && hasStoredTripPurchase(userId, trip.id));
  const canBuy = !alreadyPurchased && !soldOut;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <Link href={`/trips/${trip.id}`}>
        <img src={trip.image} alt={localize(trip.title)} className="h-56 w-full object-cover" />
      </Link>
      <div className="p-5">
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
            {getTripCategoryLabel(trip.category, isAr ? 'ar' : 'en')}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{localize(trip.place)}</span>
        </div>
        <Link href={`/trips/${trip.id}`}>
          <h2 className="text-xl font-bold text-slate-950 hover:text-emerald-700">{localize(trip.title)}</h2>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{localize(trip.description)}</p>
        <ul className="mt-3 space-y-1">
          {trip.features.slice(0, 3).map((feature) => (
            <li key={feature.en} className="text-xs text-slate-600">• {localize(feature)}</li>
          ))}
        </ul>
        <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
          <span>{trip.durationDays} {isAr ? 'أيام' : 'days'}</span>
          <span>{availableSeats} {isAr ? 'مقاعد' : 'seats'}</span>
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
