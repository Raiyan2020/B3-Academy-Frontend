'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { CourseProgressRecord } from '../types/course-progress.types';

const COURSE_PROGRESS_KEY = 'b3-course-progress';

export function getCourseProgress(userId: string, courseId: string): CourseProgressRecord {
  const existing = getAllCourseProgress().find((record) => record.userId === userId && record.courseId === courseId);
  return existing || {
    userId,
    courseId,
    completedLessonIds: [],
    videoPositions: {},
    updatedAt: new Date().toISOString(),
  };
}

export function isLessonComplete(userId: string, courseId: string, lessonId: string) {
  return getCourseProgress(userId, courseId).completedLessonIds.includes(lessonId);
}

export function markLessonComplete(userId: string, courseId: string, lessonId: string) {
  const progress = getCourseProgress(userId, courseId);
  if (progress.completedLessonIds.includes(lessonId)) return progress;

  const updated: CourseProgressRecord = {
    ...progress,
    completedLessonIds: [...progress.completedLessonIds, lessonId],
    updatedAt: new Date().toISOString(),
  };

  const otherRecords = getAllCourseProgress().filter((record) => record.userId !== userId || record.courseId !== courseId);
  writeLocalStorageJson(COURSE_PROGRESS_KEY, [updated, ...otherRecords]);
  return updated;
}

export function saveResumePoint(userId: string, courseId: string, lessonId: string, seconds?: number) {
  const progress = getCourseProgress(userId, courseId);
  const updated: CourseProgressRecord = {
    ...progress,
    lastLessonId: lessonId,
    videoPositions: {
      ...(progress.videoPositions || {}),
      ...(seconds !== undefined ? { [lessonId]: seconds } : {}),
    },
    updatedAt: new Date().toISOString(),
  };

  const otherRecords = getAllCourseProgress().filter((record) => record.userId !== userId || record.courseId !== courseId);
  writeLocalStorageJson(COURSE_PROGRESS_KEY, [updated, ...otherRecords]);
  return updated;
}

function getAllCourseProgress() {
  return readLocalStorageJson<CourseProgressRecord[]>(COURSE_PROGRESS_KEY, []);
}
