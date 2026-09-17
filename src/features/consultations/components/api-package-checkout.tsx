'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '@/LanguageContext';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import {
  useConsultationAvailableSlots,
  useDoctorConsultationPackages,
  useIndividualConsultationTypes,
  usePurchaseConsultationPackage,
} from '../hooks/use-consultations-catalog';
import type { IndividualConsultationType, PurchaseConsultationPackageInput } from '../types/catalog.types';

interface ScheduledSession {
  bookingType: IndividualConsultationType;
  appointmentDate: string;
  startTime: string;
}

const CURRENCIES = ['KWD', 'SAR', 'AED', 'USD', 'EUR'] as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function createIdempotencyKey(packageId: string) {
  return `consultation_package_${packageId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function ApiPackageCheckout() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const packageId = params?.id ?? '';
  const doctorId = searchParams.get('doctorId') ?? '';
  const packagesQuery = useDoctorConsultationPackages(doctorId, 1, 50);
  const typesQuery = useIndividualConsultationTypes(doctorId);
  const methodsQuery = usePaymentMethods();
  const purchase = usePurchaseConsultationPackage(doctorId, packageId);
  const [bookingType, setBookingType] = useState<IndividualConsultationType | ''>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [currency, setCurrency] = useState('KWD');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [userName, setUserName] = useState(user?.name ?? '');
  const [userEmail, setUserEmail] = useState(user?.email ?? '');
  const [userPhone, setUserPhone] = useState(user?.phone ?? '');
  const [resultMessage, setResultMessage] = useState('');

  const selectedPackage = useMemo(
    () => packagesQuery.data?.items.find((item) => item.id === packageId),
    [packageId, packagesQuery.data?.items],
  );
  const availableTypes = typesQuery.data?.types.filter((item) => item.isAvailable) ?? [];
  const effectiveType = (bookingType || availableTypes[0]?.type || '') as IndividualConsultationType | '';
  const slotsQuery = useConsultationAvailableSlots(doctorId, appointmentDate || undefined, effectiveType || undefined);
  const minimumDate = sessions.length
    ? addDays(sessions[sessions.length - 1].appointmentDate, selectedPackage?.minimumDaysBetweenSessions ?? 0)
    : today();
  const isScheduleComplete = Boolean(selectedPackage && sessions.length >= selectedPackage.sessionsCount);

  if (!user) return null;
  if (packagesQuery.isLoading || typesQuery.isLoading || methodsQuery.isLoading) {
    return <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">{isAr ? 'جارٍ تحميل الدفع...' : 'Loading checkout...'}</main>;
  }

  if (!doctorId || packagesQuery.isError || typesQuery.isError || !selectedPackage) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="mx-auto max-w-xl rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-red-700">{isAr ? 'الباقة غير متاحة.' : 'Consultation package is unavailable.'}</p>
          <Link href="/consultations" className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
            {isAr ? 'العودة إلى الاستشارات' : 'Back to consultations'}
          </Link>
        </div>
      </main>
    );
  }

  const addSession = () => {
    if (!effectiveType || !appointmentDate || !startTime || isScheduleComplete) return;
    setSessions((current) => [...current, { bookingType: effectiveType, appointmentDate, startTime }]);
    setAppointmentDate('');
    setStartTime('');
    setBookingType('');
  };

  const handlePurchase = () => {
    if (!isScheduleComplete || !paymentMethodId || !userName || !userEmail || !userPhone || purchase.isPending) return;
    setResultMessage('');
    const input: PurchaseConsultationPackageInput = {
      paymentMethodId,
      currency,
      idempotencyKey: createIdempotencyKey(packageId),
      sessions: sessions.map((session, index) => ({
        sessionNumber: index + 1,
        bookingType: session.bookingType,
        appointmentDate: session.appointmentDate,
        startTime: session.startTime,
      })),
      userName,
      userEmail,
      userPhone,
    };
    purchase.mutate(input, {
      onSuccess: (result) => {
        if (result.payment.paymentUrl) {
          window.location.href = result.payment.paymentUrl;
        } else if (result.consultationPackageOrder) {
          router.push('/dashboard/consultations');
        } else {
          setResultMessage(result.payment.message || result.payment.statusLabel || (isAr ? 'تم إنشاء عملية الدفع.' : 'Purchase request created.'));
        }
      },
      onError: (error) => setResultMessage(error instanceof Error ? error.message : (isAr ? 'تعذر إتمام الشراء.' : 'Could not complete the purchase.')),
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">{isAr ? 'شراء باقة استشارات' : 'Consultation package checkout'}</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">{selectedPackage.name}</h1>
        {selectedPackage.description && <p className="mt-3 text-sm leading-6 text-slate-600">{selectedPackage.description}</p>}
        <p className="mt-3 text-sm font-semibold text-emerald-700">{selectedPackage.sessionsCount} {isAr ? 'جلسات' : 'sessions'} · {selectedPackage.totalPrice.toFixed(2)} KWD</p>

        {!isScheduleComplete && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="font-bold text-slate-900">{isAr ? `حجز الجلسة ${sessions.length + 1} من ${selectedPackage.sessionsCount}` : `Schedule session ${sessions.length + 1} of ${selectedPackage.sessionsCount}`}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {availableTypes.map((option) => (
                <button key={option.type} type="button" onClick={() => { setBookingType(option.type as IndividualConsultationType); setStartTime(''); }} className={`rounded-md border p-3 text-start ${effectiveType === option.type ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                  <span className="font-semibold">{option.typeLabel}</span>
                  <span className="mt-1 block text-xs text-slate-600">{option.price.toFixed(2)} KWD</span>
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-semibold text-slate-700">{isAr ? 'التاريخ' : 'Date'}
              <input type="date" min={minimumDate} value={appointmentDate} onChange={(event) => { setAppointmentDate(event.target.value); setStartTime(''); }} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2" />
            </label>
            {appointmentDate && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-700">{isAr ? 'المواعيد المتاحة' : 'Available times'}</p>
                {slotsQuery.isLoading ? <p className="mt-2 text-sm text-slate-500">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</p> : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(slotsQuery.data?.slots ?? []).map((slot) => (
                      <button key={slot.startTime} type="button" onClick={() => setStartTime(slot.startTime)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${startTime === slot.startTime ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-700'}`}>{slot.startTime}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button type="button" onClick={addSession} disabled={!effectiveType || !appointmentDate || !startTime} className="mt-5 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600">
              {sessions.length + 1 === selectedPackage.sessionsCount ? (isAr ? 'تأكيد الجلسة والمتابعة للدفع' : 'Confirm session and continue to payment') : (isAr ? 'تأكيد الجلسة التالية' : 'Confirm and schedule next session')}
            </button>
          </div>
        )}

        {sessions.length > 0 && <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-700"><p className="font-semibold">{isAr ? 'الجلسات المحددة' : 'Scheduled sessions'}</p>{sessions.map((session, index) => <p key={`${session.appointmentDate}-${session.startTime}-${index}`} className="mt-1">{index + 1}. {session.appointmentDate} {session.startTime} · {session.bookingType.endsWith('video_consultation') ? (isAr ? 'مرئية' : 'Video') : (isAr ? 'نصية' : 'Text')}</p>)}</div>}

        {isScheduleComplete && (
          <div className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">{isAr ? 'الاسم' : 'Name'}<input value={userName} onChange={(event) => setUserName(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm font-semibold text-slate-700">{isAr ? 'البريد الإلكتروني' : 'Email'}<input type="email" value={userEmail} onChange={(event) => setUserEmail(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm font-semibold text-slate-700">{isAr ? 'الهاتف' : 'Phone'}<input value={userPhone} onChange={(event) => setUserPhone(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm font-semibold text-slate-700">{isAr ? 'العملة' : 'Currency'}<select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">{CURRENCIES.map((option) => <option key={option}>{option}</option>)}</select></label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">{isAr ? 'طريقة الدفع' : 'Payment method'}<select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</option>{(methodsQuery.data ?? []).map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label>
            <button type="button" disabled={!paymentMethodId || !userName || !userEmail || !userPhone || purchase.isPending} onClick={handlePurchase} className="w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600">{purchase.isPending ? (isAr ? 'جارٍ إنشاء الدفع...' : 'Creating checkout...') : isAr ? 'إتمام الشراء' : 'Purchase now'}</button>
            {resultMessage && <div className="rounded-md border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{resultMessage}</div>}
          </div>
        )}
        <Link href="/dashboard/consultations" className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:underline">{isAr ? 'عرض استشاراتي' : 'View my consultations'}</Link>
      </section>
    </main>
  );
}
