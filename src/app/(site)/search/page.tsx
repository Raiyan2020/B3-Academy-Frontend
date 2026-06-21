'use client';

import { Suspense } from 'react';
import { SitePage } from '../../client-page';
import { SearchPage } from '@/features/search/components/search-page';

export default function Page() {
  return (
    <SitePage>
      <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
        <SearchPage />
      </Suspense>
    </SitePage>
  );
}

