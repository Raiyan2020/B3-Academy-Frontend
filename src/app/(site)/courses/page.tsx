'use client';

import { SitePage } from '../../client-page';
import { CourseCatalog } from '@/features/courses/components/course-catalog';

export default function Page() {
  return (
    <SitePage>
      <CourseCatalog />
    </SitePage>
  );
}
