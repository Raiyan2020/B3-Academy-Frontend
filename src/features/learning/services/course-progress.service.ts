'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { Lesson } from '../../../../types';
import { getCourseRecord } from '@/features/courses/services/courses.service';
import { getCourseEnrollment } from './enrollment.service';
import type { CourseProgressRecord } from '../types/course-progress.types';

const COURSE_PROGRESS_KEY = 'b3-course-progress';

export type LessonContentType = 'video' | 'text' | 'materials';

export function getLessonContentType(lesson: Lesson): LessonContentType {
  if (lesson.videoUrl) return 'video';
  if (lesson.materials && lesson.materials.length > 0) return 'materials';
  return 'text';
}

export function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1 && Number.isFinite(parts[0])) return parts[0] * 60;
  return 0;
}

export function getVideoWatchThresholdSeconds(lesson: Lesson): number {
  const total = parseDurationToSeconds(lesson.duration);
  if (total <= 0) return 30;
  return Math.min(total, Math.max(30, Math.floor(total * 0.8)));
}

function getAllCourseProgress() {
  return readLocalStorageJson<CourseProgressRecord[]>(COURSE_PROGRESS_KEY, []);
}

export function getCourseProgress(userId: string, courseId: string): CourseProgressRecord {
  const existing = getAllCourseProgress().find((record) => record.userId === userId && record.courseId === courseId);
  return (
    existing || {
      userId,
      courseId,
      completedLessonIds: [],
      videoPositions: {},
      updatedAt: new Date().toISOString(),
    }
  );
}

export function isLessonComplete(userId: string, courseId: string, lessonId: string) {
  return getCourseProgress(userId, courseId).completedLessonIds.includes(lessonId);
}

export function isSectionEntitled(userId: string, courseId: string, sectionId: string): boolean {
  const enrollment = getCourseEnrollment(userId, courseId);
  if (!enrollment) return false;
  return enrollment.sectionEntitlements.includes(sectionId);
}

export function getLessonLockReason(userId: string, courseId: string, lessonId: string): 'installment' | 'sequential' | null {
  const course = getCourseRecord(courseId);
  if (!course) return null;
  const courseModule = course.modules.find((candidate) => candidate.lessons.some((lesson) => lesson.id === lessonId));
  if (!courseModule) return null;
  if (!isSectionEntitled(userId, courseId, courseModule.id)) return 'installment';

  const orderedLessons = course.modules.flatMap((module) => module.lessons);
  const targetIndex = orderedLessons.findIndex((lesson) => lesson.id === lessonId);
  if (targetIndex <= 0) return null;

  for (let index = 0; index < targetIndex; index += 1) {
    if (!isLessonComplete(userId, courseId, orderedLessons[index].id)) {
      return 'sequential';
    }
  }

  return null;
}

export function isLessonAccessible(userId: string, courseId: string, lessonId: string): boolean {
  const course = getCourseRecord(courseId);
  if (!course) return false;
  const courseModule = course.modules.find((candidate) => candidate.lessons.some((lesson) => lesson.id === lessonId));
  if (!courseModule) return false;
  if (!isSectionEntitled(userId, courseId, courseModule.id)) return false;

  const orderedLessons = course.modules.flatMap((module) => module.lessons);
  const targetIndex = orderedLessons.findIndex((lesson) => lesson.id === lessonId);
  if (targetIndex <= 0) return true;

  for (let index = 0; index < targetIndex; index += 1) {
    if (!isLessonComplete(userId, courseId, orderedLessons[index].id)) {
      return false;
    }
  }

  return true;
}

export function canMarkLessonComplete(
  userId: string,
  courseId: string,
  lesson: Lesson,
  watchedSeconds?: number,
): boolean {
  if (isLessonComplete(userId, courseId, lesson.id)) return true;

  const contentType = getLessonContentType(lesson);
  if (contentType === 'video') {
    const progress = getCourseProgress(userId, courseId);
    const watched = watchedSeconds ?? progress.videoPositions?.[lesson.id] ?? 0;
    return watched >= getVideoWatchThresholdSeconds(lesson);
  }

  return true;
}

export function markLessonComplete(userId: string, courseId: string, lessonId: string) {
  const progress = getCourseProgress(userId, courseId);
  if (progress.completedLessonIds.includes(lessonId)) return progress;

  const updated: CourseProgressRecord = {
    ...progress,
    completedLessonIds: [...progress.completedLessonIds, lessonId],
    lastLessonId: lessonId,
    updatedAt: new Date().toISOString(),
  };

  const otherRecords = getAllCourseProgress().filter(
    (record) => record.userId !== userId || record.courseId !== courseId,
  );
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

  const otherRecords = getAllCourseProgress().filter(
    (record) => record.userId !== userId || record.courseId !== courseId,
  );
  writeLocalStorageJson(COURSE_PROGRESS_KEY, [updated, ...otherRecords]);
  return updated;
}

export function getAccessibleLessons(userId: string, courseId: string): Lesson[] {
  const course = getCourseRecord(courseId);
  if (!course) return [];
  return course.modules
    .filter((module) => isSectionEntitled(userId, courseId, module.id))
    .flatMap((module) => module.lessons);
}

export function getCourseProgressSummary(userId: string, courseId: string) {
  const accessibleLessons = getAccessibleLessons(userId, courseId);
  const progress = getCourseProgress(userId, courseId);
  const completedCount = accessibleLessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
  return {
    completedCount,
    totalAccessible: accessibleLessons.length,
    percent: accessibleLessons.length > 0 ? Math.round((completedCount / accessibleLessons.length) * 100) : 0,
    lastLessonId: progress.lastLessonId,
  };
}
