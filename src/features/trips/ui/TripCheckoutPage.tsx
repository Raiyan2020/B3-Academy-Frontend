'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import { useTripPackageDetail, usePurchaseTrip } from '../hooks/use-trips-api';

function createIdempotencyKey(tripId: string) {
  return `trip_${tripId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const CURRENCIES = ['KWD', 'USD', 'SAR', 'AED', 'EUR'];

export function TripCheckoutPage({ tripId }: { tripId: string }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const detailQuery = useTripPackageDetail(tripId);
  const methodsQuery = usePaymentMethods();
  const purchase = usePurchaseTrip(tripId);

  const [currency, setCurrency] = useState('KWD');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const trip = detailQuery.data;

  if (detailQuery.isLoading || methodsQuery.isLoading) {
    return <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">{isAr ? 'جارٍ تحميل الدفع...' : 'Loading checkout...'}</main>;
  }

  if (detailQuery.isError || !trip) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="mx-auto max-w-xl rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-red-700">{isAr ? 'الرحلة غير متاحة.' : 'Trip is unavailable.'}</p>
          <Link href="/trips" className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
            {isAr ? 'العودة إلى الرحلات' : 'Back to trips'}
          </Link>
        </div>
      </main>
    );
  }

  if (trip.requiresTripInitialConsultation) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="mx-auto max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-semibold text-amber-900">
            {isAr
              ? 'يجب إتمام الاستشارة الأولية العامة قبل شراء باقة الرحلة.'
              : 'You must complete the general initial consultation before purchasing this trip package.'}
          </p>
          <Link href={`/trips/${tripId}/initial-consultation`} className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
            {isAr ? 'حجز الاستشارة الأولية' : 'Book initial consultation'}
          </Link>
        </div>
      </main>
    );
  }

  if (trip.isPurchased || trip.existingOrder) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-slate-800">{isAr ? 'لقد اشتريت هذه الباقة بالفعل.' : 'You already purchased this package.'}</p>
          <Link href="/dashboard/trips" className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
            {isAr ? 'عرض باقاتي' : 'View my packages'}
          </Link>
        </div>
      </main>
    );
  }

  const canSubmit = Boolean(paymentMethodId) && trip.canPurchase && !trip.isFullyBooked;

  const handlePurchase = () => {
    if (!canSubmit) return;
    setResultMessage('');
    purchase.mutate(
      {
        paymentMethodId,
        currency,
        idempotencyKey: createIdempotencyKey(tripId),
      },
      {
        onSuccess: (result) => {
          if (result.payment.paymentUrl) {
            window.location.href = result.payment.paymentUrl;
            return;
          }
          if (result.tripPackageOrder) {
            router.push('/dashboard/trips');
            return;
          }
          setResultMessage(result.payment.message || result.payment.statusLabel || (isAr ? 'تم إنشاء عملية الدفع.' : 'Purchase request created.'));
        },
      },
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">{isAr ? 'شراء باقة رحلة' : 'Trip package checkout'}</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">{trip.name}</h1>
        {trip.location && <p className="mt-1 text-sm text-slate-600">{trip.location}</p>}
        {trip.description && <p className="mt-3 text-sm leading-6 text-slate-600">{trip.description}</p>}

        <div className="mt-6 flex items-center justify-between gap-4 rounded-md bg-slate-50 p-4">
          <span className="font-semibold text-slate-700">{isAr ? 'الإجمالي' : 'Total'}</span>
          <span className="text-2xl font-bold text-emerald-700">{formatPrice(trip.price)}</span>
        </div>

        {trip.isFullyBooked && (
          <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            {isAr ? 'اكتملت المقاعد لهذه الباقة.' : 'This package is fully booked.'}
          </p>
        )}

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'العملة' : 'Currency'}</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'طريقة الدفع' : 'Payment method'}</label>
        <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          <option value="">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</option>
          {(methodsQuery.data || []).map((method) => (
            <option key={method.id} value={method.id}>{method.name}</option>
          ))}
        </select>

        <button
          type="button"
          disabled={!canSubmit || purchase.isPending}
          onClick={handlePurchase}
          className="mt-6 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600"
        >
          {purchase.isPending ? (isAr ? 'جارٍ إنشاء الدفع...' : 'Creating checkout...') : isAr ? 'إتمام الشراء' : 'Purchase now'}
        </button>

        {resultMessage && <div className="mt-6 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{resultMessage}</div>}
        <Link href="/dashboard/trips" className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'عرض باقاتي' : 'View my packages'}
        </Link>
      </section>
    </main>
  );
}
