'use client';

import { SitePage } from '../../client-page';
import { RateUsPage } from '@/features/reviews/components/rate-us-page';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <RateUsPage />
      </RequireAuth>
    </SitePage>
  );
}
