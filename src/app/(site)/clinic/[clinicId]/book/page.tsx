'use client';

import { SitePage } from '../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams } from 'next/navigation';
import { ClinicBookingFlow } from '@/features/clinic/components/clinic-booking-flow';

export default function ClinicBookingPage() {
  const { clinicId } = useParams<{ clinicId: string }>();

  return (
    <SitePage>
      <RequireAuth>
        <div className="min-h-screen bg-slate-50 py-12">
          <ClinicBookingFlow initialClinicId={clinicId} />
        </div>
      </RequireAuth>
    </SitePage>
  );
}
