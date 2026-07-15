'use client';

import { SitePage } from '../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { useParams } from 'next/navigation';
import { ClinicInitialConsultationFlow } from '@/features/clinic/components/clinic-initial-consultation-flow';

export default function ClinicInitialConsultationPage() {
  const { clinicId } = useParams<{ clinicId: string }>();

  return (
    <SitePage>
      <RequireAuth>
        <div className="min-h-screen bg-slate-50">
          <ClinicInitialConsultationFlow clinicId={clinicId} />
        </div>
      </RequireAuth>
    </SitePage>
  );
}
