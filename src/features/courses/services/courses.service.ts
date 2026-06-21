import { MOCK_COURSES } from '../data/courses.mock';

export function getCourses() {
  return MOCK_COURSES;
}

export function getCourseById(id: string | undefined) {
  if (!id) return undefined;
  return MOCK_COURSES.find((course) => course.id === id);
}

export function getFeaturedCourses(limit = 3) {
  return MOCK_COURSES.slice(0, limit);
}
