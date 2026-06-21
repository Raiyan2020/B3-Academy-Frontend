'use client';

import { SitePage } from '../../client-page';
import { TripsPage } from '@/features/trips/components/trips-page';

export default function Page() {
  return (
    <SitePage>
      <TripsPage />
    </SitePage>
  );
}
