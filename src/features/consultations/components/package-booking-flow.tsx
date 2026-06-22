'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import {
  CARE_DOCTORS,
  getConsultationPackageById,
} from '@/features/care/services/care-data.service';
import { getConsultationTypeConfig } from '@/features/care/services/care-schedule-config.service';
import { canPurchaseConsultationPackage } from '@/features/care/services/booking-guards.service';
import { BookingSlotSelector } from './booking-slot-selector';

interface SessionDraft {
  format: 'video' | 'text';
  slotId: string;
  date: string;
  time: string;
  duration: number;
}

interface PackageBookingFlowProps {
  packageId: string;
}

function addDays(date: string, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function PackageBookingFlow({ packageId }: PackageBookingFlowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { localize, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const pkg = getConsultationPackageById(packageId);
  const doctor = pkg ? CARE_DOCTORS.find((item) => item.id === pkg.doctorId) : undefined;

  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessions, setSessions] = useState<SessionDraft[]>([]);
  const [currentFormat, setCurrentFormat] = useState<'video' | 'text'>('video');
  const [message, setMessage] = useState('');

  if (!user || !pkg || !doctor) {
    return (
      <div className="p-20 text-center text-slate-600">
        {language === 'ar' ? 'الباقة غير متاحة.' : 'Package unavailable.'}
      </div>
    );
  }

  if (!canPurchaseConsultationPackage(user.id)) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-lg font-semibold text-amber-900">
          {language === 'ar'
            ? 'لديك باقتان نشطتان. أكمل إحداهما قبل شراء باقة جديدة.'
            : 'You already have two active packages. Complete one before purchasing another.'}
        </p>
      </div>
    );
  }

  const minDate =
    sessionIndex > 0
      ? addDays(sessions[sessionIndex - 1].date, pkg.sessionIntervalDays)
      : undefined;

  const handleSelectSlot = (slotId: string, date: string, time: string) => {
    if (minDate && date < minDate) {
      setMessage(
        language === 'ar'
          ? `يجب أن تكون الجلسة بعد ${minDate} (فاصل ${pkg.sessionIntervalDays} أيام).`
          : `Session must be on or after ${minDate} (${pkg.sessionIntervalDays}-day interval).`,
      );
      return;
    }

    const config = getConsultationTypeConfig(doctor.id, currentFormat);
    const nextSession: SessionDraft = {
      format: currentFormat,
      slotId,
      date,
      time,
      duration: config?.durationMinutes ?? pkg.sessionDurationMinutes,
    };
    const nextSessions = [...sessions, nextSession];
    setSessions(nextSessions);
    setMessage('');

    if (nextSessions.length >= pkg.sessionCount) {
      const params = new URLSearchParams();
      nextSessions.forEach((session, index) => {
        params.set(`slot${index}`, session.slotId);
        params.set(`format${index}`, session.format);
        params.set(`date${index}`, session.date);
        params.set(`time${index}`, session.time);
      });
      router.push(`/checkout/consultation-package/${pkg.id}?${params.toString()}`);
      return;
    }

    setSessionIndex(sessionIndex + 1);
    setCurrentFormat('video');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold text-slate-950">{localize(pkg.name)}</h1>
        <p className="mt-2 text-sm text-slate-600">{localize(pkg.description)}</p>
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          {pkg.sessionCount} {language === 'ar' ? 'جلسات' : 'sessions'} · {formatPrice(pkg.price)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {language === 'ar' ? 'الجلسة' : 'Session'} {sessionIndex + 1} / {pkg.sessionCount}
        </p>
        {sessions.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            {sessions.map((session, index) => (
              <li key={`${session.slotId}-${index}`}>
                {index + 1}. {session.date} {session.time} ({session.format})
              </li>
            ))}
          </ul>
        )}
      </div>

      {message && <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p>}

      <div className="mb-4 flex gap-2">
        {(['video', 'text'] as const).map((format) => {
          const config = getConsultationTypeConfig(doctor.id, format);
          if (!config) return null;
          return (
            <button
              key={format}
              type="button"
              onClick={() => setCurrentFormat(format)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${currentFormat === format ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {format === 'video' ? (language === 'ar' ? 'مرئية' : 'Video') : (language === 'ar' ? 'نصية' : 'Text')}
            </button>
          );
        })}
      </div>

      <BookingSlotSelector
        doctorId={doctor.id}
        serviceKind="package_session"
        minDate={minDate}
        onSelectSlot={handleSelectSlot}
        title={language === 'ar' ? `حجز الجلسة ${sessionIndex + 1}` : `Book session ${sessionIndex + 1}`}
        description={
          language === 'ar'
            ? `اختر نوع الجلسة والموعد. الفاصل الأدنى بين الجلسات ${pkg.sessionIntervalDays} أيام.`
            : `Choose session type and slot. Minimum interval is ${pkg.sessionIntervalDays} days.`
        }
        confirmLabel={
          sessionIndex + 1 >= pkg.sessionCount
            ? (language === 'ar' ? 'إنهاء والمتابعة للدفع' : 'Finish & pay')
            : (language === 'ar' ? 'تأكيد والانتقال للجلسة التالية' : 'Confirm & next session')
        }
      />
    </div>
  );
}
