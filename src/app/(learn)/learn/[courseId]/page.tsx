'use client';

import { CoursePlayer } from '@/features/learning/components/course-player';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <RequireAuth>
      <CoursePlayer />
    </RequireAuth>
  );
}
