'use client';

import React from 'react';
import { SitePage } from '../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CARE_DOCTORS } from '@/features/care/services/care-data.service';
import { BookingSlotSelector } from '@/features/consultations/components/booking-slot-selector';
import { useLanguage } from '../../../../../../LanguageContext';

export default function DoctorConsultationBookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const format = searchParams?.get('format') || 'video';
  const clinicId = searchParams?.get('clinicId') || '';
  const isInitial = searchParams?.get('isInitial') || '';
  const { localize, language } = useLanguage();

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

  const handleSelectSlot = (slotId: string) => {
    router.push(
      `/checkout/consultation-session/${doctor.id}?format=${format}&slotId=${slotId}&clinicId=${clinicId}&isInitial=${isInitial}`
    );
  };

  const consultationTypeLabel =
    isInitial === 'true'
      ? language === 'ar'
        ? 'استشارة أولية'
        : 'Initial Consultation'
      : format === 'video'
      ? language === 'ar'
        ? 'استشارة مرئية فردية'
        : 'Individual Video Consultation'
      : language === 'ar'
      ? 'استشارة نصية فردية'
      : 'Individual Text Consultation';

  return (
    <SitePage>
      <RequireAuth>
        <div className="bg-slate-50 min-h-screen py-12">
          <BookingSlotSelector
            onSelectSlot={handleSelectSlot}
            title={
              language === 'ar'
                ? `حجز ${consultationTypeLabel} مع ${localize(doctor.name)}`
                : `Book ${consultationTypeLabel} with ${localize(doctor.name)}`
            }
            description={
              language === 'ar'
                ? `اختر موعداً متاحاً لإجراء الاستشارة.`
                : `Select an available slot for your consultation session.`
            }
          />
        </div>
      </RequireAuth>
    </SitePage>
  );
}
