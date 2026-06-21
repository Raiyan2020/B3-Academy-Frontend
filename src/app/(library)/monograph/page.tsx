'use client';

import { SitePage } from '../../client-page';
import { MonographList } from '@/features/library/components/monograph-list';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <MonographList />
      </RequireAuth>
    </SitePage>
  );
}
