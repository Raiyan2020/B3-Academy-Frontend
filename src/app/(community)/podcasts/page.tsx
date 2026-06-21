'use client';

import { SitePage } from '../../client-page';
import { PodcastLibrary } from '@/features/podcasts/components/podcast-library';

export default function Page() {
  return (
    <SitePage>
      <PodcastLibrary />
    </SitePage>
  );
}
