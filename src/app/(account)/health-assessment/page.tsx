'use client';

import { SitePage } from '../../client-page';
import { HealthAssessmentPage } from '@/features/health-assessment/components/health-assessment-page';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <HealthAssessmentPage />
      </RequireAuth>
    </SitePage>
  );
}
