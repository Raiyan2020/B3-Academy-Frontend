'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import { useClinicAvailableSlots, useClinicDetail } from '../hooks/use-clinics-query';
import { useBookClinicAppointment, useFulfillAppointmentSlot } from '../hooks/use-clinic-booking';

interface ClinicBookingFlowProps {
  initialClinicId: string;
}

function createIdempotencyKey(clinicId: string) {
  return `clinic_appt_${clinicId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const CURRENCIES = ['KWD', 'USD', 'SAR', 'AED', 'EUR'];

export function ClinicBookingFlow({ initialClinicId }: ClinicBookingFlowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const clinicId = initialClinicId;
  const detailQuery = useClinicDetail(clinicId);
  const methodsQuery = usePaymentMethods();
  const book = useBookClinicAppointment(clinicId);
  const fulfill = useFulfillAppointmentSlot(clinicId);

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [currency, setCurrency] = useState('KWD');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [clientName, setClientName] = useState(user?.name ?? '');
  const [clientEmail, setClientEmail] = useState(user?.email ?? '');
  const [clientPhone, setClientPhone] = useState(user?.phone ?? '');
  const [notes, setNotes] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const slotsQuery = useClinicAvailableSlots(clinicId, date || undefined, date ? 'in_clinic' : undefined);
  const slots = useMemo(() => slotsQuery.data?.slots ?? [], [slotsQuery.data]);

  const clinic = detailQuery.data;

  if (!user) return null;

  if (detailQuery.isLoading) {
    return <div className="p-20 text-center text-slate-600">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>;
  }

  if (!clinic) {
    return <div className="p-20 text-center text-slate-600">{isAr ? 'العيادة غير متاحة للحجز.' : 'Clinic is not available for booking.'}</div>;
  }

  if (!clinic.canBookInClinic) {
    // can_book_in_clinic = completed initial consultation AND no active booking with the doctor.
    // Distinguish the two block reasons so the message isn't misleading.
    const activeBookingBlock = clinic.hasCompletedInitialConsultation;
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-lg font-semibold text-amber-900">
          {activeBookingBlock
            ? (isAr
              ? 'لديك حجز نشط مع هذا الطبيب. أكمله قبل حجز موعد جديد.'
              : 'You already have an active booking with this doctor. Complete it before booking a new appointment.')
            : (clinic.initialConsultation?.statusLabel
              || (isAr
                ? 'يجب إتمام الاستشارة الأولية مع طبيب العيادة قبل حجز موعد العيادة.'
                : 'You must complete the initial consultation with the clinic doctor before booking an appointment.'))}
        </p>
        {!activeBookingBlock && (
          <a
            href={`/clinic/${clinic.id}/initial-consultation`}
            className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            {isAr ? 'حجز الاستشارة الأولية' : 'Book initial consultation'}
          </a>
        )}
      </div>
    );
  }

  const canSubmit = Boolean(date && startTime && paymentMethodId && clientName && clientEmail && clientPhone);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setResultMessage('');
    const idempotencyKey = createIdempotencyKey(clinicId);
    book.mutate(
      {
        appointmentDate: date,
        startTime,
        paymentMethodId,
        currency,
        idempotencyKey,
        userName: clientName,
        userEmail: clientEmail,
        userPhone: clientPhone,
        notes: notes || undefined,
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
              {
                onSuccess: () => router.push('/dashboard/clinic-bookings'),
              },
            );
            return;
          }
          setResultMessage(result.payment.message || result.payment.statusLabel || (isAr ? 'تم إنشاء الحجز.' : 'Booking created.'));
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-bold text-slate-900">
          {isAr ? `حجز موعد في ${clinic.name}` : `Book at ${clinic.name}`}
        </h1>
        {clinic.doctor && <p className="mt-1 text-sm text-slate-600">{clinic.doctor.name}</p>}
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="font-semibold text-slate-700">{isAr ? 'التاريخ' : 'Date'}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setStartTime('');
            }}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        {date && (
          <div>
            <span className="text-sm font-semibold text-slate-700">{isAr ? 'المواعيد المتاحة' : 'Available times'}</span>
            {slotsQuery.isLoading ? (
              <p className="mt-2 text-sm text-slate-500">{isAr ? 'جارٍ تحميل المواعيد...' : 'Loading slots...'}</p>
            ) : slots.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">{isAr ? 'لا توجد مواعيد متاحة في هذا اليوم.' : 'No available times on this day.'}</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => setStartTime(slot.startTime)}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                      startTime === slot.startTime ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">{isAr ? 'العملة' : 'Currency'}</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">{isAr ? 'طريقة الدفع' : 'Payment method'}</span>
            <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</option>
              {(methodsQuery.data || []).map((method) => (
                <option key={method.id} value={method.id}>{method.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4">
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={isAr ? 'الاسم' : 'Name'} className="rounded-md border border-slate-300 px-3 py-2" />
          <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} className="rounded-md border border-slate-300 px-3 py-2" />
          <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={isAr ? 'الهاتف' : 'Phone'} className="rounded-md border border-slate-300 px-3 py-2" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'} rows={3} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>

        <button
          type="button"
          disabled={!canSubmit || book.isPending || fulfill.isPending}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600"
        >
          {book.isPending || fulfill.isPending ? (isAr ? 'جارٍ المعالجة...' : 'Processing...') : isAr ? 'المتابعة للدفع' : 'Continue to payment'}
        </button>

        {resultMessage && (
          <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{resultMessage}</div>
        )}
      </div>
    </div>
  );
}
