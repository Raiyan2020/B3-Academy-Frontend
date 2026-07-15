'use client';

import { SitePage } from '../../../client-page';
import { ConsultationsList } from '@/features/consultations/components/consultations-list';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <ConsultationsList />
      </RequireAuth>
    </SitePage>
  );
}
