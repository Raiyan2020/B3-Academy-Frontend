'use client';

import React from 'react';
import { SitePage } from '../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams, useSearchParams } from 'next/navigation';
import { CARE_DOCTORS } from '@/features/care/services/care-data.service';
import { IndividualBookingFlow } from '@/features/consultations/components/individual-booking-flow';
import { useLanguage } from '../../../../../../LanguageContext';

export default function DoctorConsultationBookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const searchParams = useSearchParams();
  const format = (searchParams?.get('format') || 'video') as 'video' | 'text';
  const clinicId = searchParams?.get('clinicId') || '';
  const isInitial = searchParams?.get('isInitial') === 'true';
  const tripId = searchParams?.get('tripId') || '';
  const { language } = useLanguage();

  const doctor = CARE_DOCTORS.find((d) => d.id === doctorId);

  if (!doctor) {
    return (
      <SitePage>
        <div className="p-20 text-center text-slate-600">
          {language === 'ar' ? 'الطبيب غير موجود' : 'Doctor not found'}
        </div>
      </SitePage>
    );
  }

  return (
    <SitePage>
      <RequireAuth>
        <div className="min-h-screen bg-slate-50 py-12">
          <IndividualBookingFlow
            doctorId={doctor.id}
            initialFormat={format}
            clinicId={clinicId}
            tripId={tripId}
            isInitial={isInitial}
          />
        </div>
      </RequireAuth>
    </SitePage>
  );
}
