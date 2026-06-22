'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { Course, Quiz } from '../../../../types';
import { getCourseRecord, getCourseMetadata } from '@/features/courses/services/courses.service';
import { isLessonComplete } from './course-progress.service';

export interface QuizAttempt {
  id: string;
  userId: string;
  courseId: string;
  quizId: string;
  attemptNumber: number;
  submittedAnswers: Record<string, number>;
  score: number;
  correctCount: number;
  wrongCount: number;
  passed: boolean;
  attemptedAt: string;
}

const QUIZ_ATTEMPTS_KEY = 'b3-quiz-attempts';

function getAllAttempts(): QuizAttempt[] {
  return readLocalStorageJson<QuizAttempt[]>(QUIZ_ATTEMPTS_KEY, []).map((attempt) => ({
    ...attempt,
    courseId: attempt.courseId || '',
    attemptNumber: attempt.attemptNumber || 1,
    submittedAnswers: attempt.submittedAnswers || {},
  }));
}

export function getQuizAttempts(userId: string, quizId?: string): QuizAttempt[] {
  const userAttempts = getAllAttempts().filter((attempt) => attempt.userId === userId);
  return quizId ? userAttempts.filter((attempt) => attempt.quizId === quizId) : userAttempts;
}

export function hasPassedQuiz(userId: string, quizId: string): boolean {
  return getQuizAttempts(userId, quizId).some((attempt) => attempt.passed);
}

export function getPassedQuizIds(userId: string, courseId?: string): string[] {
  const attempts = getQuizAttempts(userId).filter((attempt) => attempt.passed);
  const scoped = courseId ? attempts.filter((attempt) => attempt.courseId === courseId) : attempts;
  return Array.from(new Set(scoped.map((attempt) => attempt.quizId)));
}

export function canRetryQuiz(userId: string, quizId: string, maxAttempts?: number): boolean {
  if (hasPassedQuiz(userId, quizId)) return false;
  if (!maxAttempts) return true;
  return getQuizAttempts(userId, quizId).length < maxAttempts;
}

function findModuleForQuiz(course: Course, quizId: string) {
  return course.modules.find((module) => module.quiz?.id === quizId);
}

export function areModuleLessonsComplete(userId: string, courseId: string, moduleId: string): boolean {
  const course = getCourseRecord(courseId);
  if (!course) return false;
  const courseModule = course.modules.find((candidate) => candidate.id === moduleId);
  if (!courseModule) return false;
  return courseModule.lessons.every((lesson) => isLessonComplete(userId, courseId, lesson.id));
}

export function isModuleQuizLocked(
  userId: string,
  courseId: string,
  quizId: string,
): { locked: boolean; reason?: 'lessons-incomplete' } {
  const course = getCourseRecord(courseId);
  const metadata = getCourseMetadata(courseId);
  if (!course || !metadata?.quizConfig.moduleQuizRequiresLessonsComplete) return { locked: false };

  const courseModule = findModuleForQuiz(course, quizId);
  if (!courseModule) return { locked: false };
  if (!areModuleLessonsComplete(userId, courseId, courseModule.id)) {
    return { locked: true, reason: 'lessons-incomplete' };
  }
  return { locked: false };
}

export function areAllModuleQuizzesPassed(userId: string, courseId: string): boolean {
  const course = getCourseRecord(courseId);
  if (!course) return false;
  const moduleQuizzes = course.modules.map((module) => module.quiz).filter((quiz): quiz is Quiz => Boolean(quiz));
  if (moduleQuizzes.length === 0) return true;
  return moduleQuizzes.every((quiz) => hasPassedQuiz(userId, quiz.id));
}

export function isFinalExamLocked(
  userId: string,
  courseId: string,
): { locked: boolean; reason?: 'module-quizzes-incomplete' } {
  const metadata = getCourseMetadata(courseId);
  if (!metadata?.quizConfig.finalExamRequiresModuleQuizzesPassed) return { locked: false };
  if (!areAllModuleQuizzesPassed(userId, courseId)) {
    return { locked: true, reason: 'module-quizzes-incomplete' };
  }
  return { locked: false };
}

export function saveQuizAttempt(input: {
  userId: string;
  courseId: string;
  quizId: string;
  submittedAnswers: Record<string, number>;
  score: number;
  correctCount: number;
  wrongCount: number;
  passed: boolean;
}) {
  const priorAttempts = getQuizAttempts(input.userId, input.quizId);
  const attempt: QuizAttempt = {
    id: `attempt-${Date.now()}`,
    ...input,
    attemptNumber: priorAttempts.length + 1,
    attemptedAt: new Date().toISOString(),
  };

  writeLocalStorageJson(QUIZ_ATTEMPTS_KEY, [attempt, ...getAllAttempts()]);
  return attempt;
}
