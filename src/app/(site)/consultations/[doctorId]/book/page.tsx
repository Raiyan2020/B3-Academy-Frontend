'use client';

import React from 'react';
import { SitePage } from '../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams } from 'next/navigation';
import { IndividualBookingFlow } from '@/features/consultations/components/individual-booking-flow';
import { useLanguage } from '@/LanguageContext';

export default function DoctorConsultationBookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { language } = useLanguage();

  if (!doctorId) {
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
          <IndividualBookingFlow doctorId={doctorId} />
        </div>
      </RequireAuth>
    </SitePage>
  );
}
