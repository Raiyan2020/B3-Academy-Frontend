'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import {
  CARE_DOCTORS,
  getConsultationPackageById,
} from '@/features/care/services/care-data.service';
import { getConsultationTypeConfig } from '@/features/care/services/care-schedule-config.service';
import { canBookIndividualConsultation } from '@/features/care/services/booking-guards.service';
import { BookingSlotSelector } from './booking-slot-selector';
import { HealthAssessmentOptionalPrompt } from '@/features/health-assessment/components/health-assessment-optional-prompt';
import { shouldShowHealthAssessmentPrompt } from '@/features/health-assessment/services/health-assessment-prompt.service';

interface IndividualBookingFlowProps {
  doctorId: string;
  initialFormat: 'video' | 'text';
  clinicId?: string;
  tripId?: string;
  isInitial?: boolean;
}

export function IndividualBookingFlow({
  doctorId: initialDoctorId,
  initialFormat,
  clinicId = '',
  tripId = '',
  isInitial = false,
}: IndividualBookingFlowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { localize, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [format, setFormat] = useState<'video' | 'text'>(initialFormat);
  const [step, setStep] = useState<'type' | 'slot' | 'review'>(isInitial ? 'type' : 'slot');
  const [selectedSlot, setSelectedSlot] = useState<{ id: string; date: string; time: string } | null>(null);
  const [showHealthPrompt, setShowHealthPrompt] = useState(
    () => Boolean(isInitial && user && shouldShowHealthAssessmentPrompt(user.id)),
  );

  const bookingReturnHref = `/consultations/${doctorId}/book?${new URLSearchParams({
    ...(clinicId ? { clinicId } : {}),
    ...(tripId ? { tripId } : {}),
    ...(isInitial ? { isInitial: 'true' } : {}),
    format,
  }).toString()}`;

  const doctor = CARE_DOCTORS.find((item) => item.id === doctorId);
  const typeConfig = getConsultationTypeConfig(doctorId, format);

  const serviceKind = isInitial
    ? clinicId
      ? 'clinic_initial'
      : 'trip_initial'
    : format === 'video'
      ? 'individual_video'
      : 'individual_text';

  const availableTypes = useMemo(() => {
    if (isInitial) return (['video', 'text'] as const);
    return (['video', 'text'] as const).filter((item) => getConsultationTypeConfig(doctorId, item));
  }, [doctorId, isInitial]);

  if (!user) return null;

  if (!isInitial && !canBookIndividualConsultation(user.id)) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-lg font-semibold text-amber-900">
          {language === 'ar'
            ? 'لديك استشارتان قادمتان. أكمل إحداهما قبل حجز استشارة جديدة.'
            : 'You already have two upcoming consultations. Complete one before booking another.'}
        </p>
      </div>
    );
  }

  if (!doctor || doctor.isActive === false) {
    return (
      <div className="p-20 text-center text-slate-600">
        {language === 'ar' ? 'الطبيب غير متاح.' : 'Doctor is unavailable.'}
      </div>
    );
  }

  const handleDoctorChange = (nextDoctorId: string) => {
    setDoctorId(nextDoctorId);
    setFormat('video');
    setSelectedSlot(null);
    setStep('type');
  };

  const handleFormatChange = (nextFormat: 'video' | 'text') => {
    setFormat(nextFormat);
    setSelectedSlot(null);
    setStep('slot');
  };

  const price = typeConfig?.priceUsd ?? (format === 'video' ? 150 : 100);
  const duration = typeConfig?.durationMinutes ?? (format === 'video' ? 45 : 30);

  const proceedToCheckout = () => {
    if (!selectedSlot) return;
    const params = new URLSearchParams({
      format,
      slotId: selectedSlot.id,
      slotDate: selectedSlot.date,
      slotTime: selectedSlot.time,
      clinicId,
      isInitial: isInitial ? 'true' : '',
      tripId,
      clientName: user.name,
      clientEmail: user.email,
      clientPhone: user.phone ?? '',
    });
    router.push(`/checkout/consultation-session/${doctorId}?${params.toString()}`);
  };

  if (showHealthPrompt) {
    return (
      <HealthAssessmentOptionalPrompt
        userId={user.id}
        returnHref={bookingReturnHref}
        onSkip={() => setShowHealthPrompt(false)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {!isInitial && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">{language === 'ar' ? 'الطبيب' : 'Doctor'}</span>
            <select
              value={doctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            >
              {CARE_DOCTORS.filter((item) => item.isActive !== false).map((item) => (
                <option key={item.id} value={item.id}>{localize(item.name)}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 'type' && isInitial && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">{language === 'ar' ? 'اختر نوع الاستشارة' : 'Choose consultation type'}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {availableTypes.map((item) => {
              const config = getConsultationTypeConfig(doctorId, item);
              if (!config) return null;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleFormatChange(item)}
                  className="rounded-xl border border-slate-200 p-4 text-start hover:border-emerald-300"
                >
                  <p className="font-bold">{item === 'video' ? (language === 'ar' ? 'مرئية' : 'Video') : (language === 'ar' ? 'نصية' : 'Text')}</p>
                  <p className="mt-1 text-sm text-slate-600">{config.durationMinutes} min - {formatPrice(config.priceUsd)}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 'type' && !isInitial && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">{language === 'ar' ? 'نوع الاستشارة' : 'Consultation type'}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {availableTypes.map((item) => {
              const config = getConsultationTypeConfig(doctorId, item);
              if (!config) return null;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleFormatChange(item)}
                  className={`rounded-xl border p-4 text-start ${format === item ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}
                >
                  <p className="font-bold">{item === 'video' ? (language === 'ar' ? 'مرئية' : 'Video') : (language === 'ar' ? 'نصية' : 'Text')}</p>
                  <p className="mt-1 text-sm text-slate-600">{config.durationMinutes} min - {formatPrice(config.priceUsd)}</p>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setStep('slot')} className="mt-6 w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white">
            {language === 'ar' ? 'اختيار الموعد' : 'Choose appointment'}
          </button>
        </div>
      )}

      {step === 'slot' && (
        <BookingSlotSelector
          doctorId={doctorId}
          serviceKind={serviceKind}
          clinicId={clinicId || undefined}
          tripId={tripId || undefined}
          onSelectSlot={(slotId, date, time) => {
            setSelectedSlot({ id: slotId, date, time });
            setStep('review');
          }}
          title={language === 'ar' ? `حجز مع ${localize(doctor.name)}` : `Book with ${localize(doctor.name)}`}
          description={language === 'ar' ? 'اختر اليوم ثم الوقت.' : 'Pick a day, then a time.'}
          confirmLabel={language === 'ar' ? 'متابعة للمراجعة' : 'Continue to review'}
        />
      )}

      {step === 'review' && selectedSlot && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">{language === 'ar' ? 'مراجعة الحجز' : 'Review booking'}</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p><strong>{language === 'ar' ? 'الطبيب:' : 'Doctor:'}</strong> {localize(doctor.name)}</p>
            <p><strong>{language === 'ar' ? 'النوع:' : 'Type:'}</strong> {format === 'video' ? (language === 'ar' ? 'مرئية' : 'Video') : (language === 'ar' ? 'نصية' : 'Text')}</p>
            <p><strong>{language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> {selectedSlot.date}</p>
            <p><strong>{language === 'ar' ? 'الوقت:' : 'Time:'}</strong> {selectedSlot.time}</p>
            <p><strong>{language === 'ar' ? 'المدة:' : 'Duration:'}</strong> {duration} min</p>
            <p><strong>{language === 'ar' ? 'السعر:' : 'Price:'}</strong> {formatPrice(price)}</p>
            <p><strong>{language === 'ar' ? 'العميل:' : 'Client:'}</strong> {user.name} / {user.email}</p>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep('slot')} className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700">
              {language === 'ar' ? 'تغيير الموعد' : 'Change slot'}
            </button>
            <button type="button" onClick={proceedToCheckout} className="flex-1 rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white">
              {language === 'ar' ? 'المتابعة للدفع' : 'Continue to payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
