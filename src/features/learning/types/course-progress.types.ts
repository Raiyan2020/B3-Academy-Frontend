export interface CourseProgressRecord {
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  lastLessonId?: string;
  videoPositions?: Record<string, number>; // lessonId -> seconds
  updatedAt: string;
}
