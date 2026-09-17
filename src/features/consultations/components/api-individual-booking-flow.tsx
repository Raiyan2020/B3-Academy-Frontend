'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '@/LanguageContext';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import {
  useBookIndividualConsultation,
  useConsultationAvailableSlots,
  useIndividualConsultationTypes,
  useFulfillIndividualConsultationSlot,
} from '../hooks/use-consultations-catalog';
import type { IndividualConsultationType } from '../types/catalog.types';

function createIdempotencyKey(doctorId: string) {
  return `consultation_${doctorId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function ApiIndividualBookingFlow({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const typesQuery = useIndividualConsultationTypes(doctorId);
  const methodsQuery = usePaymentMethods();
  const book = useBookIndividualConsultation(doctorId);
  const fulfill = useFulfillIndividualConsultationSlot(doctorId);
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [currency, setCurrency] = useState('KWD');
  const [message, setMessage] = useState('');

  const selectedType = typesQuery.data?.types.find((item) => item.type === type);
  const slotType = type || undefined;
  const slotsQuery = useConsultationAvailableSlots(doctorId, date || undefined, slotType);
  const slots = useMemo(() => slotsQuery.data?.slots ?? [], [slotsQuery.data]);
  const canSubmit = Boolean(type && date && startTime && paymentMethodId && user);

  if (!user) return null;
  if (typesQuery.isLoading || methodsQuery.isLoading) {
    return <div className="mx-auto max-w-2xl p-16 text-center text-slate-600">{isAr ? 'جار التحميل...' : 'Loading...'}</div>;
  }
  if (typesQuery.error) {
    return <div className="mx-auto max-w-2xl p-16 text-center text-red-600">{isAr ? 'تعذر تحميل أنواع الاستشارات.' : 'Could not load consultation types.'}</div>;
  }

  const submit = () => {
    if (!canSubmit || !selectedType) return;
    setMessage('');
    book.mutate(
      {
        type: selectedType.type as IndividualConsultationType,
        appointmentDate: date,
        startTime,
        paymentMethodId,
        currency,
        idempotencyKey: createIdempotencyKey(doctorId),
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone ?? '',
      },
      {
        onSuccess: (result) => {
          if (result.payment.paymentUrl) {
            window.location.href = result.payment.paymentUrl;
            return;
          }
          if (result.payment.requiresSlotSelection && result.payment.paymentRef) {
            fulfill.mutate(
              { paymentRef: result.payment.paymentRef, appointmentDate: date, startTime },
              { onSuccess: () => router.push('/dashboard/consultations') },
            );
            return;
          }
          setMessage(result.payment.message || result.payment.statusLabel || (isAr ? 'تم إنشاء الحجز.' : 'Booking created.'));
        },
        onError: (error) => setMessage(error instanceof Error ? error.message : (isAr ? 'تعذر إتمام الحجز.' : 'Could not complete booking.')),
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{isAr ? 'حجز استشارة فردية' : 'Book an individual consultation'}</h1>
      <p className="mt-2 text-sm text-slate-600">{isAr ? `الطبيب رقم ${doctorId}` : `Doctor ${doctorId}`}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {typesQuery.data?.types.filter((item) => item.isAvailable).map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => { setType(item.type); setStartTime(''); }}
            className={`rounded-xl border p-4 text-start ${type === item.type ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}
          >
            <p className="font-bold">{item.typeLabel}</p>
            <p className="mt-1 text-sm text-slate-600">{item.durationMinutes ? `${item.durationMinutes} min · ` : ''}{item.price.toFixed(2)} KWD</p>
          </button>
        ))}
      </div>

      {type && (
        <>
          <label className="mt-6 block text-sm font-semibold text-slate-700">
            {isAr ? 'التاريخ' : 'Date'}
            <input type="date" value={date} onChange={(event) => { setDate(event.target.value); setStartTime(''); }} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          {date && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700">{isAr ? 'المواعيد المتاحة' : 'Available times'}</p>
              {slotsQuery.isLoading ? <p className="mt-2 text-sm text-slate-500">{isAr ? 'جار التحميل...' : 'Loading...'}</p> : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button key={slot.startTime} type="button" onClick={() => setStartTime(slot.startTime)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${startTime === slot.startTime ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-700'}`}>
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">{isAr ? 'العملة' : 'Currency'}
          <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2">
            {['KWD', 'USD', 'SAR', 'AED', 'EUR'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">{isAr ? 'طريقة الدفع' : 'Payment method'}
          <select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</option>
            {(methodsQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>

      <button type="button" onClick={submit} disabled={!canSubmit || book.isPending || fulfill.isPending} className="mt-6 w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600">
        {book.isPending || fulfill.isPending ? (isAr ? 'جار المعالجة...' : 'Processing...') : isAr ? 'تأكيد الحجز' : 'Confirm booking'}
      </button>
      {message && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}
    </div>
  );
}
