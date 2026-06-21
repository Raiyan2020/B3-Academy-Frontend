'use client';

import { SitePage } from '../../../client-page';
import { MonographDetail } from '@/features/library/components/monograph-detail';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <MonographDetail />
      </RequireAuth>
    </SitePage>
  );
}
