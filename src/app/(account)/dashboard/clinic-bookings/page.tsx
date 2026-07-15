'use client';

import { SitePage } from '../../../client-page';
import { ClinicBookingsList } from '@/features/consultations/components/clinic-bookings-list';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <ClinicBookingsList />
      </RequireAuth>
    </SitePage>
  );
}
