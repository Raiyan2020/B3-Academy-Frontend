'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { useLanguage } from '../../../../LanguageContext';
import { ShareButton } from '@/components/actions/share-button';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';
import { useCurrency } from '../../../../CurrencyContext';
import { useTripPackageDetail } from '../hooks/use-trips-api';
import type { TripPackageDetail } from '../types/api.types';

function prerequisiteLabel(trip: TripPackageDetail, isAr: boolean) {
  if (!trip.requiresTripInitialConsultation) {
    return isAr
      ? 'بعد الشراء تتواصل الإدارة معك للتنسيق خارج المنصة.'
      : 'After purchase, administration coordinates execution outside the platform.';
  }
  if (trip.canPurchase) {
    return isAr
      ? 'تم إتمام الاستشارة الأولية. بعد الشراء تتواصل الإدارة معك للتنسيق خارج المنصة.'
      : 'The initial consultation is complete. After purchase, administration coordinates execution outside the platform.';
  }
  return isAr
    ? 'شراء باقة الرحلة يتطلب إتمام الاستشارة الأولية العامة الخاصة بالرحلات.'
    : 'Buying a trip package requires completing the general trip initial consultation.';
}

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user, requireAuthAction } = useAuth();
  const [message, setMessage] = useState('');
  const isAr = language === 'ar';

  const detailQuery = useTripPackageDetail(tripId);
  const trip = detailQuery.data;

  if (detailQuery.isLoading) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  if (detailQuery.isError || !trip) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{isAr ? 'باقة الرحلة غير متاحة.' : 'Trip package is unavailable.'}</div>;
  }

  const soldOut = trip.isFullyBooked;
  const alreadyPurchased = trip.isPurchased || Boolean(trip.existingOrder);
  const canCheckout = trip.canPurchase || !trip.requiresTripInitialConsultation;

  const handlePurchase = () => {
    const initialHref = `/trips/${trip.id}/initial-consultation`;
    const checkoutHref = `/checkout/trip-package/${trip.id}`;
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

    if (alreadyPurchased) {
      setMessage(isAr ? 'لا يمكن شراء نفس باقة الرحلة أكثر من مرة.' : 'This trip package cannot be purchased twice.');
      return;
    }
    if (soldOut) {
      setMessage(isAr ? 'لا توجد مقاعد متاحة لهذه الباقة.' : 'No seats are available for this package.');
      return;
    }
    router.push(destination);
  };

  const ctaLabel = alreadyPurchased
    ? (isAr ? 'تم شراء الباقة' : 'Already purchased')
    : soldOut
      ? (isAr ? 'نفدت المقاعد' : 'Sold out')
      : canCheckout
        ? (isAr ? 'شراء الباقة' : 'Buy package')
        : (isAr ? 'حجز الاستشارة الأولية' : 'Book initial consultation');

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-white">
        {trip.image && <img src={trip.image} alt={trip.name} className="h-80 w-full object-cover" />}
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {trip.category && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {trip.category.name}
                  </span>
                )}
                {trip.location && <p className="text-sm font-semibold text-slate-600">{trip.location}</p>}
              </div>
              <h1 className="mt-2 text-4xl font-bold text-slate-950">{trip.name}</h1>
              <p className="mt-4 max-w-3xl leading-8 text-slate-600">{trip.description || trip.shortDescription}</p>
            </div>
            <div className="flex gap-2">
              <ShareButton title={trip.name} />
              <FavoriteButton favorite={{ itemId: trip.id, kind: 'trip', title: trip.name, href: `/trips/${trip.id}`, isAvailable: true }} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        {message && <div className="lg:col-span-2 rounded-md bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div>}
        <article className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-950">{isAr ? 'مميزات الباقة' : 'Package features'}</h2>
          <ul className="mt-4 grid gap-3">
            {trip.features.map((feature, index) => (
              <li key={`${feature}-${index}`} className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{feature}</li>
            ))}
          </ul>
          <p className="mt-6 rounded-md bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
            {prerequisiteLabel(trip, isAr)}
          </p>
        </article>
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-3xl font-bold text-emerald-700">{formatPrice(trip.price)}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            {trip.duration && <p>{isAr ? 'المدة' : 'Duration'}: {trip.duration}</p>}
            {trip.remainingSpots != null && <p>{isAr ? 'المقاعد المتاحة' : 'Available seats'}: {trip.remainingSpots}</p>}
            <p>
              {isAr ? 'الحالة' : 'Status'}:{' '}
              {alreadyPurchased
                ? (isAr ? 'تم الشراء' : 'Purchased')
                : soldOut
                  ? (isAr ? 'نفدت المقاعد' : 'Sold out')
                  : (isAr ? 'متاحة' : 'Available')}
            </p>
          </div>
          {alreadyPurchased && (
            <Link href="/dashboard/trips" className="mt-3 block text-sm font-semibold text-emerald-700 hover:underline">
              {isAr ? 'عرض باقاتي المشتراة' : 'View my purchased packages'}
            </Link>
          )}
          <button
            onClick={handlePurchase}
            disabled={alreadyPurchased || soldOut}
            className="mt-5 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {ctaLabel}
          </button>
        </aside>
      </section>
    </main>
  );
}

export { TripDetailPage as TripDetail };
