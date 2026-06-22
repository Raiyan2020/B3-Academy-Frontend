'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { useLanguage } from '../../../../LanguageContext';
import { getTripPackageById, getTripCategoryLabel } from '@/features/care/services/care-data.service';
import { hasStoredTripPurchase, getStoredConsultations } from '@/features/care/services/care-records-storage.service';
import {
  evaluateTripInitialConsultation,
  isPrerequisiteSatisfied,
  type PrerequisiteStatus,
} from '@/features/care/services/care-prerequisite.service';
import { getTripAvailableSeats, isTripSoldOut } from '@/features/care/services/trip-capacity.service';
import { ShareButton } from '@/components/actions/share-button';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';
import { useCurrency } from '../../../../CurrencyContext';

function prerequisiteLabel(status: PrerequisiteStatus, isAr: boolean) {
  if (status === 'missing') {
    return isAr
      ? 'شراء باقة الرحلة يتطلب إتمام الاستشارة الأولية العامة الخاصة بالرحلات.'
      : 'Buying a trip package requires completing the general trip initial consultation.';
  }
  if (status === 'scheduled') {
    return isAr
      ? 'لديك استشارة أولية مجدولة. أكملها أولاً قبل شراء باقة الرحلة.'
      : 'You have a scheduled initial consultation. Complete it before purchasing a trip package.';
  }
  return isAr
    ? 'شراء باقة الرحلة يتطلب إتمام الاستشارة الأولية. بعد الشراء تتواصل الإدارة معك للتنسيق خارج المنصة.'
    : 'Buying a trip package requires completing the general trip initial consultation. After purchase, administration coordinates execution outside the platform.';
}

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const { localize, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user, requireAuthAction } = useAuth();
  const [message, setMessage] = useState('');
  const trip = getTripPackageById(tripId);
  const isAr = language === 'ar';

  if (!trip) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{isAr ? 'باقة الرحلة غير متاحة.' : 'Trip package is unavailable.'}</div>;
  }

  const availableSeats = getTripAvailableSeats(trip.id);
  const soldOut = isTripSoldOut(trip.id);
  const prerequisiteStatus = user ? evaluateTripInitialConsultation(user.id) : 'missing';
  const prerequisiteComplete = isPrerequisiteSatisfied(prerequisiteStatus);
  const alreadyPurchased = Boolean(user && hasStoredTripPurchase(user.id, trip.id));
  const scheduledRecord = user
    ? getStoredConsultations(user.id).find(
        (record) =>
          record.serviceKind === 'trip_initial' &&
          (record.status === 'scheduled' || record.status === 'purchased'),
      )
    : undefined;

  const handlePurchase = () => {
    const initialHref = `/trips/${trip.id}/initial-consultation`;
    const checkoutHref = `/checkout/trip-package/${trip.id}`;

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

    if (prerequisiteStatus === 'scheduled' && scheduledRecord) {
      router.push(`/consultation/${scheduledRecord.id}`);
      return;
    }
    if (!prerequisiteComplete) {
      router.push(initialHref);
      return;
    }
    if (alreadyPurchased) {
      setMessage(isAr ? 'لا يمكن شراء نفس باقة الرحلة أكثر من مرة.' : 'This trip package cannot be purchased twice.');
      return;
    }
    if (soldOut) {
      setMessage(isAr ? 'لا توجد مقاعد متاحة لهذه الباقة.' : 'No seats are available for this package.');
      return;
    }
    router.push(checkoutHref);
  };

  const ctaLabel = alreadyPurchased
    ? (isAr ? 'تم شراء الباقة' : 'Already purchased')
    : soldOut
      ? (isAr ? 'نفدت المقاعد' : 'Sold out')
      : prerequisiteComplete
        ? (isAr ? 'شراء الباقة' : 'Buy package')
        : prerequisiteStatus === 'scheduled'
          ? (isAr ? 'عرض الاستشارة الأولية' : 'View initial consultation')
          : (isAr ? 'حجز الاستشارة الأولية' : 'Book initial consultation');

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-white">
        <img src={trip.image} alt={localize(trip.title)} className="h-80 w-full object-cover" />
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {getTripCategoryLabel(trip.category, isAr ? 'ar' : 'en')}
                </span>
                <p className="text-sm font-semibold text-slate-600">{localize(trip.place)}</p>
              </div>
              <h1 className="mt-2 text-4xl font-bold text-slate-950">{localize(trip.title)}</h1>
              <p className="mt-4 max-w-3xl leading-8 text-slate-600">{localize(trip.description)}</p>
            </div>
            <div className="flex gap-2">
              <ShareButton title={localize(trip.title)} />
              <FavoriteButton favorite={{ itemId: trip.id, kind: 'trip', title: localize(trip.title), href: `/trips/${trip.id}`, isAvailable: true }} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        {message && <div className="lg:col-span-2 rounded-md bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div>}
        <article className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-950">{isAr ? 'مميزات الباقة' : 'Package features'}</h2>
          <ul className="mt-4 grid gap-3">
            {trip.features.map((feature) => (
              <li key={feature.en} className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{localize(feature)}</li>
            ))}
          </ul>
          <p className="mt-6 rounded-md bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
            {prerequisiteLabel(prerequisiteStatus, isAr)}
          </p>
        </article>
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-3xl font-bold text-emerald-700">{formatPrice(trip.price)}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>{isAr ? 'المدة' : 'Duration'}: {trip.durationDays} {isAr ? 'أيام' : 'days'}</p>
            <p>{isAr ? 'المقاعد المتاحة' : 'Available seats'}: {availableSeats}</p>
            <p>
              {isAr ? 'الحالة' : 'Status'}:{' '}
              {alreadyPurchased
                ? (isAr ? 'تم الشراء' : 'Purchased')
                : soldOut
                  ? (isAr ? 'نفدت المقاعد' : 'Sold out')
                  : (isAr ? 'متاحة' : 'Available')}
            </p>
          </div>
          {prerequisiteStatus === 'scheduled' && scheduledRecord && (
            <Link href={`/consultation/${scheduledRecord.id}`} className="mt-3 block text-sm font-semibold text-emerald-700 hover:underline">
              {isAr ? 'عرض تفاصيل الاستشارة الأولية' : 'View initial consultation details'}
            </Link>
          )}
          <button
            onClick={handlePurchase}
            disabled={alreadyPurchased || soldOut || prerequisiteStatus === 'unavailable'}
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
