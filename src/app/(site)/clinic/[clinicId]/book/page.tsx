'use client';

import React from 'react';
import { SitePage } from '../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams, useRouter } from 'next/navigation';
import { getClinicById } from '@/features/care/services/care-data.service';
import { BookingSlotSelector } from '@/features/consultations/components/booking-slot-selector';
import { useLanguage } from '../../../../../../LanguageContext';

export default function ClinicBookingPage() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const router = useRouter();
  const { localize, language } = useLanguage();
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

  const handleSelectSlot = (slotId: string) => {
    router.push(`/checkout/clinic-appointment/${clinic.id}?slotId=${slotId}`);
  };

  return (
    <SitePage>
      <RequireAuth>
        <div className="bg-slate-50 min-h-screen py-12">
          <BookingSlotSelector
            onSelectSlot={handleSelectSlot}
            title={language === 'ar' ? `حجز موعد في ${localize(clinic.name)}` : `Book Appointment at ${localize(clinic.name)}`}
            description={
              language === 'ar'
                ? `اختر الموعد المناسب لزيارتك مع ${localize(clinic.doctor.name)}.`
                : `Select a suitable slot for your clinic visit with ${localize(clinic.doctor.name)}.`
            }
          />
        </div>
      </RequireAuth>
    </SitePage>
  );
}
