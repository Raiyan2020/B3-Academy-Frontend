'use client';

import { SitePage } from '../../client-page';
import { CourseCatalog } from '@/features/courses/components/course-catalog';

export function CoursesPageClient() {
  return (
    <SitePage>
      <CourseCatalog />
    </SitePage>
  );
}
