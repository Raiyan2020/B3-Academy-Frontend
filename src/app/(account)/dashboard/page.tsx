'use client';

import { SitePage } from '../../client-page';
import { DashboardPage } from '@/features/account/components/dashboard-page';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <DashboardPage />
      </RequireAuth>
    </SitePage>
  );
}
