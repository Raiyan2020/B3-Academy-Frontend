'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  getCourseById,
  getCourseMetadata,
  getCourses,
  getFeaturedCourses,
  getRelatedCourses,
} from '../services/courses.service';
import { addCourseEnrollment, getCourseEnrollments } from '@/features/learning/services/enrollment.service';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import type { CheckoutCourseInput, CourseDetail, CourseFilters, CourseListItem } from '../types/api.types';
import type { Course } from '../../../../types';
import { courseKeys } from '../query-keys';

function localize(value: { ar: string; en: string } | undefined, language: string) {
  if (!value) return '';
  return language === 'ar' ? value.ar : value.en;
}

function parseDurationHours(course: Course, language: string) {
  const metadata = getCourseMetadata(course.id);
  if (metadata?.durationMinutes) return Math.round((metadata.durationMinutes / 60) * 10) / 10;
  const label = localize(course.duration, language);
  const hours = Number.parseFloat(label);
  return Number.isFinite(hours) ? hours : 0;
}

function mapCourse(course: Course, language: string, enrolledIds = new Set<string>()): CourseListItem {
  const metadata = getCourseMetadata(course.id);
  const category = metadata?.categoryId ? COURSE_CATEGORIES[metadata.categoryId] : undefined;
  const level = metadata?.levelId ? COURSE_LEVELS[metadata.levelId] : undefined;

  return {
    id: course.id,
    title: localize(course.title, language),
    description: localize(course.description, language),
    imageUrl: course.thumbnail,
    category: category ? { id: metadata!.categoryId, name: localize(category, language) } : null,
    level: level ? { id: metadata!.levelId, name: localize(level, language) } : { id: course.level, name: course.level },
    instructor: {
      name: localize(course.instructor.name, language),
      image: course.instructor.avatar,
    },
    durationHours: parseDurationHours(course, language),
    price: course.price,
    currency: metadata?.baseCurrency ?? 'USD',
    isFeatured: metadata?.isFeatured ?? false,
    isEnrolled: enrolledIds.has(course.id),
    publishedAt: metadata?.publishedAt ?? null,
  };
}

function mapCourseDetail(course: Course, language: string, enrolledIds = new Set<string>()): CourseDetail {
  const metadata = getCourseMetadata(course.id);
  return {
    ...mapCourse(course, language, enrolledIds),
    trailerUrl: metadata?.trailerUrl ?? course.modules.flatMap((module) => module.lessons).find((lesson) => lesson.videoUrl)?.videoUrl ?? null,
    sections: course.modules.map((module) => ({
      id: module.id,
      title: localize(module.title, language),
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        title: localize(lesson.title, language),
        duration: lesson.duration,
        type: lesson.isFreePreview ? 'preview' : 'lesson',
      })),
    })),
    paymentModes: metadata?.paymentModes ?? ['full'],
    installmentCount: metadata?.installmentConfig?.count ?? null,
    relatedCourses: getRelatedCourses(course.id).map((related) => mapCourse(related, language, enrolledIds)),
  };
}

function filterCourses(courses: Course[], filters: CourseFilters | undefined, language: string) {
  const query = filters?.search?.trim().toLowerCase();
  const categoryId = filters?.categoryId && filters.categoryId !== 'all' ? filters.categoryId : undefined;
  const minPrice = filters?.minPrice ? Number(filters.minPrice) : undefined;
  const maxPrice = filters?.maxPrice ? Number(filters.maxPrice) : undefined;
  const minDuration = filters?.minDurationHours ? Number(filters.minDurationHours) : undefined;
  const maxDuration = filters?.maxDurationHours ? Number(filters.maxDurationHours) : undefined;

  return courses
    .filter((course) => {
      const metadata = getCourseMetadata(course.id);
      if (categoryId && metadata?.categoryId !== categoryId) return false;
      if (query) {
        const haystack = [
          localize(course.title, language),
          localize(course.subtitle, language),
          localize(course.description, language),
          course.topics.map((topic) => localize(topic, language)).join(' '),
        ].join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (Number.isFinite(minPrice) && course.price < Number(minPrice)) return false;
      if (Number.isFinite(maxPrice) && course.price > Number(maxPrice)) return false;
      const durationHours = parseDurationHours(course, language);
      if (Number.isFinite(minDuration) && durationHours < Number(minDuration)) return false;
      if (Number.isFinite(maxDuration) && durationHours > Number(maxDuration)) return false;
      return true;
    })
    .sort((a, b) => {
      const aDate = getCourseMetadata(a.id)?.publishedAt ?? '';
      const bDate = getCourseMetadata(b.id)?.publishedAt ?? '';
      return filters?.sort === 'oldest' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
    });
}

export function useCourseCategories() {
  const { language } = useLanguage();

  return useQuery({
    queryKey: [...courseKeys.categories(), language],
    queryFn: async () =>
      Object.entries(COURSE_CATEGORIES).map(([id, name]) => ({
        id,
        name: localize(name, language),
      })),
  });
}

export function useCourseApiList(filters?: CourseFilters) {
  const { language } = useLanguage();
  const { user } = useAuth();

  return useQuery({
    queryKey: courseKeys.apiList({ ...filters, language, userId: user?.id }),
    queryFn: async () => {
      const enrolledIds = new Set(user ? getCourseEnrollments(user.id).map((item) => item.courseId) : []);
      return filterCourses(getCourses(), filters, language).map((course) => mapCourse(course, language, enrolledIds));
    },
  });
}

export function useFeaturedCourseApiList(limit = 3, currency = 'USD') {
  const { language } = useLanguage();
  const { user } = useAuth();

  return useQuery({
    queryKey: courseKeys.apiFeatured(limit, `${currency}:${language}:${user?.id ?? 'guest'}`),
    queryFn: async () => {
      const enrolledIds = new Set(user ? getCourseEnrollments(user.id).map((item) => item.courseId) : []);
      return getFeaturedCourses(limit).map((course) => mapCourse(course, language, enrolledIds));
    },
  });
}

export function useCourseApiDetail(id: string, currency = 'USD') {
  const { language } = useLanguage();
  const { user } = useAuth();

  return useQuery({
    queryKey: courseKeys.apiDetail(id, `${currency}:${language}:${user?.id ?? 'guest'}`),
    queryFn: async () => {
      const course = getCourseById(id);
      if (!course) return null;
      const enrolledIds = new Set(user ? getCourseEnrollments(user.id).map((item) => item.courseId) : []);
      return mapCourseDetail(course, language, enrolledIds);
    },
    enabled: Boolean(id),
  });
}

export function useMyCourseApiList(enabled = true) {
  const { language } = useLanguage();
  const { user } = useAuth();

  return useQuery({
    queryKey: [...courseKeys.mine(), language, user?.id ?? 'guest'],
    queryFn: async () => {
      if (!user) return [];
      const enrolledIds = new Set(getCourseEnrollments(user.id).map((item) => item.courseId));
      return getCourses()
        .filter((course) => enrolledIds.has(course.id))
        .map((course) => mapCourse(course, language, enrolledIds));
    },
    enabled: enabled && Boolean(user),
  });
}

export function useCheckoutCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CheckoutCourseInput) => {
      if (!user) throw new Error('Please sign in to continue.');
      addCourseEnrollment({
        userId: user.id,
        courseId: input.courseId,
        paymentMode: input.paymentMode,
        paymentId: input.idempotencyKey,
      });
      return {
        id: input.idempotencyKey,
        status: 'local-complete',
        status_label: 'Frontend local enrollment',
        message: 'Course enrollment was recorded locally because this backend does not expose course APIs.',
        payment_url: null,
        amount: null,
        currency: input.currency,
      };
    },
    meta: { successMessage: 'Course enrollment recorded locally.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: courseKeys.mine() });
    },
  });
}
