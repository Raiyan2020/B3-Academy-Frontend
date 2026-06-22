'use client';

import React from 'react';
import { SitePage } from '../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams } from 'next/navigation';
import { getClinicById } from '@/features/care/services/care-data.service';
import { ClinicBookingFlow } from '@/features/clinic/components/clinic-booking-flow';
import { CarePrerequisiteGate } from '@/features/care/components/care-prerequisite-gate';
import { useLanguage } from '../../../../../../LanguageContext';

export default function ClinicBookingPage() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const { language } = useLanguage();
  const clinic = getClinicById(clinicId);

  if (!clinic) {
    return (
      <SitePage>
        <div className="p-20 text-center text-slate-600">
          {language === 'ar' ? 'العيادة غير موجودة' : 'Clinic not found'}
        </div>
      </SitePage>
    );
  }

  return (
    <SitePage>
      <RequireAuth>
        <CarePrerequisiteGate kind="clinic" clinicId={clinic.id}>
          <div className="min-h-screen bg-slate-50 py-12">
            <ClinicBookingFlow initialClinicId={clinic.id} />
          </div>
        </CarePrerequisiteGate>
      </RequireAuth>
    </SitePage>
  );
}
