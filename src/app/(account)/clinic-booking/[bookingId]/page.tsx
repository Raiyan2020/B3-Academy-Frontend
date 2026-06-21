'use client';

import { SitePage } from '../../../client-page';
import { ClinicBookingDetail } from '@/features/clinic/components/clinic-booking-detail';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <ClinicBookingDetail />
      </RequireAuth>
    </SitePage>
  );
}
