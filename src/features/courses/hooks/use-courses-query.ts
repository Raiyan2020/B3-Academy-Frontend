'use client';

import { useQuery } from '@tanstack/react-query';
import { getCourses, getFeaturedCourses } from '../services/courses.service';
import { courseKeys } from '../query-keys';

export function useCoursesQuery() {
  return useQuery({
    queryKey: courseKeys.lists(),
    queryFn: getCourses,
  });
}

export function useFeaturedCoursesQuery(limit = 3) {
  return useQuery({
    queryKey: courseKeys.featured(limit),
    queryFn: () => getFeaturedCourses(limit),
  });
}
