'use client';

import { useMemo, useState } from 'react';
import { SitePage } from '../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '../../../../../../LanguageContext';
import { useCurrency } from '../../../../../../CurrencyContext';
import { useAuth } from '@/features/auth/auth-provider';
import { HealthAssessmentOptionalPrompt } from '@/features/health-assessment/components/health-assessment-optional-prompt';
import { shouldShowHealthAssessmentPrompt } from '@/features/health-assessment/services/health-assessment-prompt.service';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import { useTripPackageDetail } from '@/features/trips/hooks/use-trips-api';
import {
  useBookTripInitialConsultation,
  useFulfillTripInitialConsultationSlot,
  useTripAvailableSlots,
  useTripInitialConsultationTypes,
} from '@/features/trips/hooks/use-trips-api';

function createIdempotencyKey(tripId: string) {
  return `trip_ic_${tripId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const CURRENCIES = ['KWD', 'USD', 'SAR', 'AED', 'EUR'];

export default function TripInitialConsultationBookingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { formatPrice } = useCurrency();

  const [showHealthPrompt, setShowHealthPrompt] = useState(
    () => Boolean(user && shouldShowHealthAssessmentPrompt(user.id)),
  );

  const tripQuery = useTripPackageDetail(tripId);
  const typesQuery = useTripInitialConsultationTypes();
  const methodsQuery = usePaymentMethods();
  const book = useBookTripInitialConsultation();
  const fulfill = useFulfillTripInitialConsultationSlot();

  const [selectedType, setSelectedType] = useState(''); // full enum, e.g. trip_text_initial_consultation
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [currency, setCurrency] = useState('KWD');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [clientName, setClientName] = useState(user?.name ?? '');
  const [clientEmail, setClientEmail] = useState(user?.email ?? '');
  const [clientPhone, setClientPhone] = useState(user?.phone ?? '');
  const [notes, setNotes] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const typeOptions = useMemo(() => typesQuery.data?.types.filter((t) => t.isAvailable) ?? [], [typesQuery.data]);
  // The IC-types endpoint returns the short form ('text'/'video'); the available-slots
  // endpoint requires the full CareBookingType enum. Derive it here.
  const shortType = selectedType.includes('video') ? 'video' : 'text';
  const slotType = selectedType ? `trip_${shortType}_initial_consultation` : undefined;
  const slotsQuery = useTripAvailableSlots(date || undefined, slotType);
  const slots = useMemo(() => slotsQuery.data?.slots ?? [], [slotsQuery.data]);

  const trip = tripQuery.data;
  const returnHref = `/trips/${tripId}/initial-consultation`;

  const canSubmit = Boolean(selectedType && date && startTime && paymentMethodId && clientName && clientEmail && clientPhone);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setResultMessage('');
    book.mutate(
      {
        type: shortType,
        appointmentDate: date,
        startTime,
        paymentMethodId,
        currency,
        idempotencyKey: createIdempotencyKey(tripId),
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
              { onSuccess: () => router.push('/dashboard/trips') },
            );
            return;
          }
          setResultMessage(result.payment.message || result.payment.statusLabel || (isAr ? 'تم إنشاء الحجز.' : 'Booking created.'));
        },
      },
    );
  };

  return (
    <SitePage>
      <RequireAuth>
        <div className="mx-auto max-w-2xl bg-slate-50 min-h-screen px-4 py-12">
          {showHealthPrompt && user ? (
            <HealthAssessmentOptionalPrompt userId={user.id} returnHref={returnHref} onSkip={() => setShowHealthPrompt(false)} />
          ) : tripQuery.isLoading || typesQuery.isLoading ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-slate-600">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
          ) : !trip ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-slate-600">{isAr ? 'باقة الرحلة غير موجودة' : 'Trip package not found'}</div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">
                {isAr ? `الاستشارة الأولية لرحلة: ${trip.name}` : `Initial consultation for: ${trip.name}`}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {isAr ? 'اختر نوع الاستشارة ثم الموعد وطريقة الدفع.' : 'Choose the consultation type, then a slot and payment method.'}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {typeOptions.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => {
                      setSelectedType(option.type);
                      setStartTime('');
                    }}
                    className={`rounded-xl border p-4 text-start ${selectedType === option.type ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}
                  >
                    <p className="font-bold">{option.typeLabel}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {option.durationMinutes ? `${option.durationMinutes} min · ` : ''}{formatPrice(option.price)}
                    </p>
                  </button>
                ))}
              </div>

              {selectedType && (
                <label className="mt-6 block text-sm">
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
              )}

              {selectedType && date && (
                <div className="mt-4">
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
                          className={`rounded-md border px-3 py-2 text-sm font-semibold ${startTime === slot.startTime ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-700'}`}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
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

              <div className="mt-4 grid gap-4">
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={isAr ? 'الاسم' : 'Name'} className="rounded-md border border-slate-300 px-3 py-2" />
                <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} className="rounded-md border border-slate-300 px-3 py-2" />
                <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={isAr ? 'الهاتف' : 'Phone'} className="rounded-md border border-slate-300 px-3 py-2" />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'} rows={3} className="rounded-md border border-slate-300 px-3 py-2" />
              </div>

              <button
                type="button"
                disabled={!canSubmit || book.isPending || fulfill.isPending}
                onClick={handleSubmit}
                className="mt-8 w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600"
              >
                {book.isPending || fulfill.isPending ? (isAr ? 'جارٍ المعالجة...' : 'Processing...') : isAr ? 'المتابعة للدفع' : 'Continue to payment'}
              </button>

              {resultMessage && <div className="mt-6 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{resultMessage}</div>}
            </div>
          )}
        </div>
      </RequireAuth>
    </SitePage>
  );
}
