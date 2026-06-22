import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient, dehydrateOptions } from '@/lib/query/get-query-client';
import { courseKeys } from '@/features/courses/query-keys';
import { getCourses, getFeaturedCourses } from '@/features/courses/services/courses.service';
import { CoursesPageClient } from './courses-page-client';

export default async function Page() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: courseKeys.lists(), queryFn: getCourses }),
    queryClient.prefetchQuery({ queryKey: courseKeys.featured(3), queryFn: () => getFeaturedCourses(3) }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient, dehydrateOptions())}>
      <CoursesPageClient />
    </HydrationBoundary>
  );
}
