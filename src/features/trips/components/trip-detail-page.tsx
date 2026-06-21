'use client';

import { Share2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { useLanguage } from '../../../../LanguageContext';
import { getActiveTripPackages } from '@/features/care/services/care-data.service';
import { addStoredTripPurchase, hasStoredTripPurchase } from '@/features/care/services/care-records-storage.service';
import { createSuccessfulPayment } from '@/features/payments/services/payments-storage.service';

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const { localize, language } = useLanguage();
  const { user, requireAuthAction } = useAuth();
  const [message, setMessage] = useState('');
  const trip = getActiveTripPackages().find((item) => item.id === tripId);

  if (!trip) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{language === 'ar' ? 'باقة الرحلة غير متاحة.' : 'Trip package is unavailable.'}</div>;
  }

  const hasTripInitialConsultation = user?.consultations?.some((item) => item.tripId === trip.id && item.isCompleted);
  const alreadyPurchased = Boolean(user?.trips?.some((item) => item.id === trip.id)) || Boolean(user && hasStoredTripPurchase(user.id, trip.id));

  const handlePurchase = () => {
    if (!requireAuthAction()) return;
    if (!hasTripInitialConsultation) {
      router.push(`/trips/${trip.id}/initial-consultation`);
      return;
    }
    if (alreadyPurchased) {
      setMessage(language === 'ar' ? 'لا يمكن شراء نفس باقة الرحلة أكثر من مرة.' : 'This trip package cannot be purchased twice.');
      return;
    }
    router.push(`/checkout/trip-package/${trip.id}`);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-white">
        <img src={trip.image} alt={localize(trip.title)} className="h-80 w-full object-cover" />
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">{localize(trip.place)}</p>
              <h1 className="mt-2 text-4xl font-bold text-slate-950">{localize(trip.title)}</h1>
              <p className="mt-4 max-w-3xl leading-8 text-slate-600">{localize(trip.description)}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-md border border-slate-300 p-3 text-slate-700"><Share2 className="h-5 w-5" /></button>
              <FavoriteButton favorite={{ itemId: trip.id, kind: 'trip', title: localize(trip.title), href: `/trips/${trip.id}`, isAvailable: true }} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        {message && <div className="lg:col-span-2 rounded-md bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div>}
        <article className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-950">{language === 'ar' ? 'مميزات الباقة' : 'Package features'}</h2>
          <ul className="mt-4 grid gap-3">
            {trip.features.map((feature) => (
              <li key={feature.en} className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{localize(feature)}</li>
            ))}
          </ul>
          <p className="mt-6 rounded-md bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
            {language === 'ar'
              ? 'شراء باقة الرحلة يتطلب إتمام الاستشارة الأولية العامة الخاصة بالرحلات. بعد الشراء تتواصل الإدارة معك للتنسيق خارج المنصة.'
              : 'Buying a trip package requires completing the general trip initial consultation. After purchase, administration coordinates execution outside the platform.'}
          </p>
        </article>
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-3xl font-bold text-emerald-700">${trip.price}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>{language === 'ar' ? 'المدة' : 'Duration'}: {trip.durationDays} {language === 'ar' ? 'أيام' : 'days'}</p>
            <p>{language === 'ar' ? 'المقاعد المتاحة' : 'Available seats'}: {trip.availableSeats}</p>
            <p>{language === 'ar' ? 'الحالة' : 'Status'}: {alreadyPurchased ? (language === 'ar' ? 'تم الشراء' : 'Purchased') : (language === 'ar' ? 'متاحة' : 'Available')}</p>
          </div>
          <button onClick={handlePurchase} disabled={alreadyPurchased} className="mt-5 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">
            {alreadyPurchased ? (language === 'ar' ? 'تم شراء الباقة' : 'Already purchased') : hasTripInitialConsultation ? (language === 'ar' ? 'شراء الباقة' : 'Buy package') : language === 'ar' ? 'حجز الاستشارة الأولية' : 'Book initial consultation'}
          </button>
        </aside>
      </section>
    </main>
  );
}

export { TripDetailPage as TripDetail };
