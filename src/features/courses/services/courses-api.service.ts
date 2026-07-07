import { apiFetch } from '@/lib/api/base-fetch';
import type {
  CheckoutCourseInput,
  CourseCategory,
  CourseCheckoutTransaction,
  CourseDetail,
  CourseFilters,
  CourseLesson,
  CourseListItem,
  CoursePaymentMode,
  CourseSection,
} from '../types/api.types';

type ApiObject = Record<string, any>;

interface Paginated<T> {
  items?: T[];
  data?: T[];
}

function asArray<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || [];
}

function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const localized = value as Record<string, unknown>;
    return String(localized.ar || localized.en || localized.name || fallback);
  }
  return fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapCategory(item: ApiObject): CourseCategory {
  return {
    id: String(item.id),
    name: text(item.name || item.title, 'Category'),
  };
}

function mapLesson(item: ApiObject): CourseLesson {
  return {
    id: String(item.id),
    title: text(item.title || item.name, 'Lesson'),
    duration: item.duration || item.duration_label || null,
    type: item.type || item.content_type || null,
  };
}

function mapSection(item: ApiObject): CourseSection {
  return {
    id: String(item.id),
    title: text(item.title || item.name, 'Section'),
    lessons: asArray<ApiObject>(item.lessons || item.items || []).map(mapLesson),
  };
}

function mapPaymentModes(item: ApiObject): CoursePaymentMode[] {
  const modes = item.payment_modes || item.paymentModes || [];
  if (Array.isArray(modes) && modes.length > 0) {
    return modes.filter((mode): mode is CoursePaymentMode => mode === 'full' || mode === 'installments');
  }
  return item.installments_enabled || item.installment_count ? ['full', 'installments'] : ['full'];
}

function mapCourse(item: ApiObject): CourseListItem {
  const category = item.category ? mapCategory(item.category) : item.category_id ? { id: String(item.category_id), name: text(item.category_name, '') } : null;
  const level = item.level ? { id: String(item.level.id ?? item.level_id ?? item.level), name: text(item.level.name || item.level) } : item.level_id ? { id: String(item.level_id), name: text(item.level_name, '') } : null;

  return {
    id: String(item.id),
    title: text(item.title || item.name, 'Course'),
    description: text(item.description || item.short_description || item.summary, ''),
    imageUrl: item.image || item.image_url || item.thumbnail || item.cover || null,
    category,
    level,
    instructor: item.instructor
      ? { name: text(item.instructor.name || item.instructor), image: item.instructor.image || null }
      : item.instructor_name
        ? { name: text(item.instructor_name), image: null }
        : null,
    durationHours: numberValue(item.duration_hours ?? item.hours ?? item.total_hours),
    price: numberValue(item.converted_price ?? item.price),
    currency: String(item.currency || item.base_currency || 'USD'),
    isFeatured: Boolean(item.is_featured ?? item.featured),
    isEnrolled: Boolean(item.is_enrolled ?? item.is_owned ?? item.enrolled),
    publishedAt: item.published_at || item.created_at || null,
  };
}

function mapCourseDetail(item: ApiObject): CourseDetail {
  return {
    ...mapCourse(item),
    trailerUrl: item.trailer_url || item.video_url || item.intro_video || null,
    sections: asArray<ApiObject>(item.sections || item.modules || item.curriculum || []).map(mapSection),
    paymentModes: mapPaymentModes(item),
    installmentCount: item.installment_count || item.installments_count || null,
    relatedCourses: asArray<ApiObject>(item.related_courses || item.related || []).map(mapCourse),
  };
}

function toQuery(filters: CourseFilters = {}) {
  return {
    search: filters.search,
    category_id: filters.categoryId === 'all' ? undefined : filters.categoryId,
    currency: filters.currency,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    min_duration_hours: filters.minDurationHours,
    max_duration_hours: filters.maxDurationHours,
    sort: filters.sort,
  };
}

export async function getCourseCategories() {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/courses/categories');
  return asArray(response).map(mapCategory);
}

export async function getCourses(filters?: CourseFilters) {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/courses', {
    query: toQuery(filters),
  });
  return asArray(response).map(mapCourse);
}

export async function getFeaturedCourses(limit = 3, currency = 'USD') {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/courses/featured', {
    query: { limit, currency },
  });
  return asArray(response).map(mapCourse);
}

export async function getCourseDetail(id: string, currency = 'USD') {
  const response = await apiFetch<ApiObject>(`/api/user/courses/${id}`, {
    query: { currency },
  });
  return mapCourseDetail(response);
}

export async function getMyCourses() {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/my-courses');
  return asArray(response).map(mapCourse);
}

export async function checkoutCourse(input: CheckoutCourseInput) {
  return apiFetch<CourseCheckoutTransaction>(`/api/user/courses/${input.courseId}/checkout`, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.idempotencyKey },
    body: {
      payment_method_id: Number(input.paymentMethodId),
      currency: input.currency,
      payment_mode: input.paymentMode,
      installment_number: input.installmentNumber,
      idempotency_key: input.idempotencyKey,
    },
  });
}

