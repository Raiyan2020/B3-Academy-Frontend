'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkoutCourse,
  completeMyCourseLesson,
  getCourseCategories,
  getCourseCheckoutPreview,
  getCourseDetail,
  getCourseLevels,
  getCourses,
  getFeaturedCourses,
  getMyCourseEnrollment,
  getMyCourseLesson,
  getMyCourses,
  startMyCourseQuiz,
  submitMyCourseQuiz,
} from '../services/courses-api.service';
import type { CheckoutCourseInput, CourseFilters } from '../types/api.types';
import { courseKeys } from '../query-keys';
import { toastSuccess } from '@/lib/feedback/toast';

export function useCourseCategories() {
  return useQuery({
    queryKey: courseKeys.categories(),
    queryFn: getCourseCategories,
  });
}

export function useCourseLevels() {
  return useQuery({
    queryKey: courseKeys.levels(),
    queryFn: getCourseLevels,
  });
}

export function useCourseApiList(filters?: CourseFilters) {
  return useQuery({
    queryKey: courseKeys.apiList(filters),
    queryFn: () => getCourses(filters),
  });
}

export function useFeaturedCourseApiList(limit = 3, currency = 'USD') {
  return useQuery({
    queryKey: courseKeys.apiFeatured(limit, currency),
    queryFn: () => getFeaturedCourses(limit, currency),
  });
}

export function useCourseApiDetail(id: string, currency = 'USD') {
  return useQuery({
    queryKey: courseKeys.apiDetail(id, currency),
    queryFn: () => getCourseDetail(id, currency),
    enabled: Boolean(id),
  });
}

export function useCourseCheckoutPreview(courseId: string, currency = 'USD') {
  return useQuery({
    queryKey: courseKeys.checkoutPreview(courseId, currency),
    queryFn: () => getCourseCheckoutPreview(courseId, currency),
    enabled: Boolean(courseId),
  });
}

export function useMyCourseApiList(enabled = true) {
  return useQuery({
    queryKey: courseKeys.mine(),
    queryFn: getMyCourses,
    enabled,
  });
}

export function useMyCourseApiDetail(enrollmentId: string) {
  return useQuery({
    queryKey: courseKeys.myDetail(enrollmentId),
    queryFn: () => getMyCourseEnrollment(enrollmentId),
    enabled: Boolean(enrollmentId),
  });
}

export function useMyCourseLesson(enrollmentId: string, lessonId: string) {
  return useQuery({
    queryKey: courseKeys.myLesson(enrollmentId, lessonId),
    queryFn: () => getMyCourseLesson(enrollmentId, lessonId),
    enabled: Boolean(enrollmentId && lessonId),
  });
}

export function useMyCourseQuiz(enrollmentId: string, quizId: string) {
  return useQuery({
    queryKey: courseKeys.myQuiz(enrollmentId, quizId),
    queryFn: () => startMyCourseQuiz(enrollmentId, quizId),
    enabled: Boolean(enrollmentId && quizId),
  });
}

export function useCompleteMyCourseLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, lessonId }: { enrollmentId: string; lessonId: string }) => completeMyCourseLesson(enrollmentId, lessonId),
    meta: { silentSuccess: true },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.mine() }),
        queryClient.invalidateQueries({ queryKey: courseKeys.myDetail(variables.enrollmentId) }),
        queryClient.invalidateQueries({ queryKey: courseKeys.myLesson(variables.enrollmentId, variables.lessonId) }),
      ]);
    },
  });
}

export function useSubmitMyCourseQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, quizId, answers }: { enrollmentId: string; quizId: string; answers: Record<string, number> }) =>
      submitMyCourseQuiz(enrollmentId, quizId, answers),
    meta: { silentSuccess: true },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.mine() }),
        queryClient.invalidateQueries({ queryKey: courseKeys.myDetail(variables.enrollmentId) }),
        queryClient.invalidateQueries({ queryKey: courseKeys.myQuiz(variables.enrollmentId, variables.quizId) }),
      ]);
    },
  });
}

export function useCheckoutCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkoutCourse,
    meta: { silentSuccess: true },
    onSuccess: async (transaction, variables) => {
      toastSuccess(transaction.message || transaction.status_label || 'Course checkout started.');

      const paidStatuses = new Set(['success', 'paid', 'completed', 'complete']);
      if (transaction.status && !paidStatuses.has(String(transaction.status).toLowerCase())) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.mine() }),
        queryClient.invalidateQueries({ queryKey: courseKeys.apiList() }),
        queryClient.invalidateQueries({ queryKey: courseKeys.apiDetail(variables.courseId, variables.currency) }),
      ]);
    },
  });
}
