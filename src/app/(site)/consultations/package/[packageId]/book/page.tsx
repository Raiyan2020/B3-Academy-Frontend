'use client';

import React from 'react';
import { SitePage } from '../../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams } from 'next/navigation';
import { getConsultationPackageById } from '@/features/care/services/care-data.service';
import { PackageBookingFlow } from '@/features/consultations/components/package-booking-flow';
import { useLanguage } from '../../../../../../../LanguageContext';

export default function PackageBookingPage() {
  const { packageId } = useParams<{ packageId: string }>();
  const { language } = useLanguage();
  const pkg = getConsultationPackageById(packageId);

  if (!pkg) {
    return (
      <SitePage>
        <div className="p-20 text-center text-slate-600">
          {language === 'ar' ? 'الباقة غير موجودة' : 'Package not found'}
        </div>
      </SitePage>
    );
  }

  return (
    <SitePage>
      <RequireAuth>
        <div className="min-h-screen bg-slate-50 py-12">
          <PackageBookingFlow packageId={pkg.id} />
        </div>
      </RequireAuth>
    </SitePage>
  );
}
