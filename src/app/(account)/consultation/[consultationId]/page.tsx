'use client';

import { SitePage } from '../../../client-page';
import { ConsultationDetail } from '@/features/consultations/components/consultation-detail';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <ConsultationDetail />
      </RequireAuth>
    </SitePage>
  );
}
