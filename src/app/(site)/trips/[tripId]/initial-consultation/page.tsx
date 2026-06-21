'use client';

import React from 'react';
import { SitePage } from '../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams, useRouter } from 'next/navigation';
import { getActiveTripPackages } from '@/features/care/services/care-data.service';
import { BookingSlotSelector } from '@/features/consultations/components/booking-slot-selector';
import { useLanguage } from '../../../../../../LanguageContext';

export default function TripInitialConsultationBookingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const { localize, language } = useLanguage();

  const trip = getActiveTripPackages().find((t) => t.id === tripId);

  if (!trip) {
    return (
      <SitePage>
        <div className="p-20 text-center text-slate-600">
          {language === 'ar' ? 'باقة الرحلة غير موجودة' : 'Trip package not found'}
        </div>
      </SitePage>
    );
  }

  const handleSelectSlot = (slotId: string) => {
    // We book a video consultation with dr-sarah for the trip initial consultation
    router.push(
      `/checkout/consultation-session/dr-sarah?format=video&slotId=${slotId}&tripId=${trip.id}&isInitial=true`
    );
  };

  return (
    <SitePage>
      <RequireAuth>
        <div className="bg-slate-50 min-h-screen py-12">
          <BookingSlotSelector
            onSelectSlot={handleSelectSlot}
            title={
              language === 'ar'
                ? `حجز الاستشارة الأولية لرحلة: ${localize(trip.title)}`
                : `Book Initial Consultation for trip: ${localize(trip.title)}`
            }
            description={
              language === 'ar'
                ? `اختر موعداً متاحاً لإجراء الاستشارة الأولية المطلوبة للرحلة.`
                : `Select an available slot for the required initial trip consultation.`
            }
          />
        </div>
      </RequireAuth>
    </SitePage>
  );
}
