'use client';

import { SitePage } from '../../client-page';
import { SettingsPage } from '@/features/account/components/settings-page';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <SettingsPage />
      </RequireAuth>
    </SitePage>
  );
}
