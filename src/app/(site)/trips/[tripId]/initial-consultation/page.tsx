'use client';

import React, { useState } from 'react';
import { SitePage } from '../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams, useRouter } from 'next/navigation';
import { getActiveTripPackages, getDoctorById } from '@/features/care/services/care-data.service';
import { TRIP_INITIAL_SPECIALIST_IDS } from '@/features/care/services/care-schedule-config.service';
import { useLanguage } from '../../../../../../LanguageContext';
import { useCurrency } from '../../../../../../CurrencyContext';
import { getConsultationTypeConfig } from '@/features/care/services/care-schedule-config.service';
import { useAuth } from '@/features/auth/auth-provider';
import { HealthAssessmentOptionalPrompt } from '@/features/health-assessment/components/health-assessment-optional-prompt';
import { shouldShowHealthAssessmentPrompt } from '@/features/health-assessment/services/health-assessment-prompt.service';

export default function TripInitialConsultationBookingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { localize, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [doctorId, setDoctorId] = useState(TRIP_INITIAL_SPECIALIST_IDS[0] ?? '');
  const [format, setFormat] = useState<'video' | 'text'>('video');
  const [showHealthPrompt, setShowHealthPrompt] = useState(
    () => Boolean(user && shouldShowHealthAssessmentPrompt(user.id)),
  );

  const trip = getActiveTripPackages().find((t) => t.id === tripId);
  const doctor = getDoctorById(doctorId);
  const typeConfig = getConsultationTypeConfig(doctorId, format);

  if (!trip) {
    return (
      <SitePage>
        <div className="p-20 text-center text-slate-600">
          {language === 'ar' ? 'باقة الرحلة غير موجودة' : 'Trip package not found'}
        </div>
      </SitePage>
    );
  }

  const continueBooking = () => {
    const params = new URLSearchParams({
      format,
      tripId: trip.id,
      isInitial: 'true',
      returnTripId: trip.id,
    });
    router.push(`/consultations/${doctorId}/book?${params.toString()}`);
  };

  const returnHref = `/trips/${trip.id}/initial-consultation`;

  return (
    <SitePage>
      <RequireAuth>
        <div className="mx-auto max-w-2xl bg-slate-50 min-h-screen px-4 py-12">
          {showHealthPrompt && user ? (
            <HealthAssessmentOptionalPrompt
              userId={user.id}
              returnHref={returnHref}
              onSkip={() => setShowHealthPrompt(false)}
            />
          ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              {language === 'ar'
                ? `الاستشارة الأولية لرحلة: ${localize(trip.title)}`
                : `Initial consultation for: ${localize(trip.title)}`}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {language === 'ar'
                ? 'اختر الأخصائي ونوع الاستشارة قبل اختيار الموعد.'
                : 'Choose a specialist and consultation type before selecting a slot.'}
            </p>

            <label className="mt-6 block text-sm">
              <span className="font-semibold text-slate-700">{language === 'ar' ? 'الأخصائي' : 'Specialist'}</span>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                {TRIP_INITIAL_SPECIALIST_IDS.map((id) => {
                  const item = getDoctorById(id);
                  if (!item) return null;
                  return (
                    <option key={id} value={id}>{localize(item.name)}</option>
                  );
                })}
              </select>
            </label>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(['video', 'text'] as const).map((item) => {
                const config = getConsultationTypeConfig(doctorId, item);
                if (!config) return null;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFormat(item)}
                    className={`rounded-xl border p-4 text-start ${format === item ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}
                  >
                    <p className="font-bold">{item === 'video' ? (language === 'ar' ? 'مرئية' : 'Video') : (language === 'ar' ? 'نصية' : 'Text')}</p>
                    <p className="mt-1 text-sm text-slate-600">{config.durationMinutes} min - {formatPrice(config.priceUsd)}</p>
                  </button>
                );
              })}
            </div>

            {doctor && typeConfig && (
              <p className="mt-4 text-sm text-slate-600">
                {language === 'ar' ? 'مع' : 'With'} {localize(doctor.name)} · {typeConfig.durationMinutes} min · {formatPrice(typeConfig.priceUsd)}
              </p>
            )}

            <button
              type="button"
              onClick={continueBooking}
              className="mt-8 w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white"
            >
              {language === 'ar' ? 'اختيار الموعد' : 'Choose appointment slot'}
            </button>
          </div>
          )}
        </div>
      </RequireAuth>
    </SitePage>
  );
}
