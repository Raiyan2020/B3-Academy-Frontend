'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import {
  evaluateClinicInitialConsultation,
  evaluateTripInitialConsultation,
  isPrerequisiteSatisfied,
  type PrerequisiteStatus,
} from '@/features/care/services/care-prerequisite.service';
import { useLanguage } from '../../../../LanguageContext';

function statusMessage(status: PrerequisiteStatus, isAr: boolean, kind: 'clinic' | 'trip') {
  if (status === 'completed') return null;
  if (status === 'scheduled') {
    return isAr
      ? kind === 'clinic'
        ? 'لديك استشارة أولية مجدولة. أكملها أولاً قبل حجز موعد العيادة.'
        : 'لديك استشارة أولية مجدولة. أكملها أولاً قبل شراء باقة الرحلة.'
      : kind === 'clinic'
        ? 'You have a scheduled initial consultation. Complete it before booking a clinic appointment.'
        : 'You have a scheduled initial consultation. Complete it before purchasing a trip package.';
  }
  return isAr
    ? kind === 'clinic'
      ? 'يجب إكمال الاستشارة الأولية للعيادة قبل حجز موعد.'
      : 'يجب إكمال الاستشارة الأولية العامة قبل شراء باقة الرحلة.'
    : kind === 'clinic'
      ? 'You must complete the clinic initial consultation before booking an appointment.'
      : 'You must complete the general initial consultation before purchasing a trip package.';
}

export function CarePrerequisiteGate({
  kind,
  clinicId,
  tripId,
  children,
}: {
  kind: 'clinic' | 'trip';
  clinicId?: string;
  tripId?: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  if (!user) return <>{children}</>;

  const status =
    kind === 'clinic' && clinicId
      ? evaluateClinicInitialConsultation(user.id, clinicId)
      : evaluateTripInitialConsultation(user.id);

  if (isPrerequisiteSatisfied(status)) return <>{children}</>;

  const message = statusMessage(status, isAr, kind);
  const ctaHref =
    kind === 'clinic' && clinicId
      ? `/clinic/${clinicId}`
      : tripId
        ? `/trips/${tripId}`
        : '/trips';

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
      <p className="text-lg font-semibold text-amber-900">{message}</p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white"
      >
        {isAr
          ? kind === 'clinic'
            ? 'العودة لتفاصيل العيادة'
            : 'العودة لباقات الرحلات'
          : kind === 'clinic'
            ? 'Back to clinic details'
            : 'Back to trip packages'}
      </Link>
    </div>
  );
}

export function checkCarePrerequisite(
  userId: string,
  kind: 'clinic' | 'trip',
  clinicId?: string,
): boolean {
  const status =
    kind === 'clinic' && clinicId
      ? evaluateClinicInitialConsultation(userId, clinicId)
      : evaluateTripInitialConsultation(userId);
  return isPrerequisiteSatisfied(status);
}
