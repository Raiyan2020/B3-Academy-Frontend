import { apiFetch } from '@/lib/api/base-fetch';
import type {
  CheckoutCourseInput,
  CourseCategory,
  CourseCertificateItem,
  CourseCheckoutPreview,
  CourseCheckoutPreviewSection,
  CourseCheckoutTransaction,
  CourseOrderItem,
  CourseQuizResultItem,
  CourseQuizStartItem,
  CourseCurriculumOutline,
  CourseDetail,
  CourseFilters,
  CourseLesson,
  CourseLevel,
  CourseListItem,
  CoursePrice,
  CourseSection,
  MyCourseDetail,
  MyCourseListItem,
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
    return String(localized.ar || localized.en || localized.name || localized.title || fallback);
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

function mapLevel(item: ApiObject): CourseLevel {
  return {
    id: String(item.id),
    name: text(item.name || item.title, 'Level'),
  };
}

function mapPrice(item: ApiObject): CoursePrice | null {
  const price = item.price;
  if (price && typeof price === 'object') return price as CoursePrice;
  if (price === undefined || price === null) return null;
  return {
    amount: numberValue(price),
    currency: String(item.currency || 'USD'),
  };
}

function mapLesson(item: ApiObject): CourseLesson {
  return {
    id: String(item.id),
    title: text(item.title || item.name, 'Lesson'),
    duration: item.duration || item.duration_label || null,
    type: item.type || item.content_type || null,
    typeLabel: item.type_label || null,
    content: item.content || null,
    videoUrl: item.video_url || null,
    fileUrl: item.file_url || null,
    courseQuizId: item.course_quiz_id ? String(item.course_quiz_id) : null,
    isLocked: Boolean(item.is_locked),
    isCompleted: Boolean(item.is_completed),
    isAccessible: item.is_accessible !== undefined ? Boolean(item.is_accessible) : undefined,
  };
}

function mapSection(item: ApiObject): CourseSection {
  return {
    id: String(item.id),
    title: text(item.title || item.name, 'Section'),
    position: item.position ?? null,
    lessons: asArray<ApiObject>(item.lessons || item.items || []).map(mapLesson),
    isLocked: Boolean(item.is_locked),
    isPaid: item.is_paid !== undefined ? Boolean(item.is_paid) : undefined,
    isAccessible: item.is_accessible !== undefined ? Boolean(item.is_accessible) : undefined,
  };
}

function mapCurriculumOutline(item: ApiObject): CourseCurriculumOutline {
  return {
    id: String(item.id),
    title: text(item.title || item.name, 'Section'),
    position: item.position ?? null,
    isLocked: Boolean(item.is_locked),
    lessons: asArray<ApiObject>(item.lessons || []).map(mapLesson),
  };
}

function mapCheckoutPreviewSection(item: ApiObject): CourseCheckoutPreviewSection {
  return {
    id: String(item.id),
    title: text(item.title || item.name, 'Section'),
    amount: item.amount !== undefined ? numberValue(item.amount) : null,
    currency: item.currency || null,
    isPayable: item.is_payable !== undefined ? Boolean(item.is_payable) : undefined,
    isAccessible: item.is_accessible !== undefined ? Boolean(item.is_accessible) : undefined,
    isPaid: item.is_paid !== undefined ? Boolean(item.is_paid) : undefined,
    isNextPayable: item.is_next_payable !== undefined ? Boolean(item.is_next_payable) : undefined,
    orderType: item.order_type || null,
  };
}

function mapCourse(item: ApiObject): CourseListItem {
  const category = item.category ? mapCategory(item.category) : item.category_id ? { id: String(item.category_id), name: text(item.category_name, '') } : null;
  const level = item.level ? mapLevel(item.level) : item.level_id ? { id: String(item.level_id), name: text(item.level_name, '') } : null;
  const price = mapPrice(item);

  return {
    id: String(item.id),
    title: text(item.name || item.title, 'Course'),
    description: text(item.short_description || item.description || item.summary, ''),
    imageUrl: item.image || item.image_url || item.thumbnail || item.cover || null,
    category,
    level,
    instructor: item.instructor
      ? { name: text(item.instructor.name || item.instructor), image: item.instructor.image || null }
      : item.instructor_name
        ? { name: text(item.instructor_name), image: null }
        : null,
    durationHours: numberValue(item.hours ?? item.duration_hours ?? item.total_hours),
    price: numberValue(price?.amount ?? item.converted_price ?? item.price),
    currency: String(price?.currency || item.currency || item.base_currency || 'USD'),
    isFeatured: Boolean(item.is_featured ?? item.featured),
    isEnrolled: String(item.enrollment_status || '').toLowerCase() === 'enrolled' || Boolean(item.is_enrolled ?? item.is_owned ?? item.enrolled),
    publishedAt: item.published_at || item.created_at || null,
    enrollmentStatus: item.enrollment_status || null,
    rawPrice: price,
  };
}

function mapCourseDetail(item: ApiObject): CourseDetail {
  const sections = asArray<ApiObject>(item.curriculum_outline || item.sections || item.modules || item.curriculum || []).map(
    item.curriculum_outline ? mapCurriculumOutline : mapSection,
  );
  const paymentMode = (item.payment_mode || null) as CourseDetail['paymentMode'];
  const supportsSectionPayment = Boolean(item.supports_section_payment || paymentMode === 'full_and_per_section');

  return {
    ...mapCourse(item),
    trailerUrl: item.intro_video || item.trailer_url || item.video_url || null,
    sections,
    paymentModes: supportsSectionPayment ? ['full', 'section'] : ['full'],
    paymentMode,
    paymentModeLabel: item.payment_mode_label || null,
    supportsFullPayment: item.supports_full_payment !== undefined ? Boolean(item.supports_full_payment) : true,
    supportsSectionPayment,
    installmentCount: item.installment_count || item.installments_count || null,
    relatedCourses: asArray<ApiObject>(item.similar_courses || item.related_courses || item.related || []).map(mapCourse),
  };
}

function toQuery(filters: CourseFilters = {}) {
  return {
    search: filters.search,
    course_category_id: filters.categoryId === 'all' ? undefined : filters.categoryId,
    course_level_id: filters.levelId === 'all' ? undefined : filters.levelId,
    currency: filters.currency,
    hours_min: filters.minDurationHours,
    hours_max: filters.maxDurationHours,
    price_min: filters.minPrice,
    price_max: filters.maxPrice,
    order: filters.sort === 'oldest' ? 'asc' : 'desc',
  };
}

export async function getCourseCategories() {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/courses/categories');
  return asArray(response).map(mapCategory);
}

export async function getCourseLevels() {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/courses/levels');
  return asArray(response).map(mapLevel);
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
  return asArray(response).slice(0, limit).map(mapCourse);
}

export async function getCourseCheckoutPreview(courseId: string, currency = 'USD') {
  const response = await apiFetch<ApiObject>(`/api/user/courses/${courseId}/checkout-preview`, {
    query: { currency },
  });
  return {
    course: mapCourse(response.course || response.course_data || response),
    fullPrice: response.full_price ? mapPrice({ price: response.full_price, currency: response.currency }) : mapPrice(response),
    sections: asArray<ApiObject>(response.sections || []).map(mapCheckoutPreviewSection),
    supportsFullPayment: Boolean(response.supports_full_payment),
    supportsSectionPayment: Boolean(response.supports_section_payment),
  } satisfies CourseCheckoutPreview;
}

export async function getCourseDetail(id: string, currency = 'USD') {
  const response = await apiFetch<ApiObject>(`/api/user/courses/${id}`, {
    query: { currency },
  });
  return mapCourseDetail(response);
}

export async function getMyCourses() {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/my-courses');
  return asArray(response).map(mapMyCourseList);
}

export async function checkoutCourse(input: CheckoutCourseInput): Promise<CourseCheckoutTransaction> {
  return apiFetch<CourseCheckoutTransaction>(`/api/user/courses/${input.courseId}/checkout`, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.idempotencyKey },
    body: {
      payment_method_id: Number(input.paymentMethodId),
      currency: input.currency,
      order_type: input.orderType,
      course_section_id: input.courseSectionId ? Number(input.courseSectionId) : undefined,
      idempotency_key: input.idempotencyKey,
    },
  });
}

export async function getMyCourseEnrollment(enrollmentId: string) {
  const response = await apiFetch<ApiObject>(`/api/user/my-courses/${enrollmentId}`);
  return mapMyCourseDetail(response);
}

export async function getMyCourseLesson(enrollmentId: string, lessonId: string) {
  const response = await apiFetch<ApiObject>(`/api/user/my-courses/${enrollmentId}/lessons/${lessonId}`);
  return mapLesson(response);
}

export async function completeMyCourseLesson(enrollmentId: string, lessonId: string) {
  return apiFetch<ApiObject>(`/api/user/my-courses/${enrollmentId}/lessons/${lessonId}/complete`, {
    method: 'POST',
  });
}

export async function startMyCourseQuiz(enrollmentId: string, quizId: string) {
  const response = await apiFetch<ApiObject>(`/api/user/my-courses/${enrollmentId}/quizzes/${quizId}`);
  return mapQuizStart(response);
}

export async function submitMyCourseQuiz(enrollmentId: string, quizId: string, answers: Record<string, number>) {
  return apiFetch<CourseQuizResultItem>(`/api/user/my-courses/${enrollmentId}/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: { answers },
  });
}

export function getMyCourseCertificateUrl(enrollmentId: string) {
  return `/api/user/my-courses/${enrollmentId}/certificate`;
}

export function getMyCourseInvoiceUrl(enrollmentId: string, orderId: string) {
  return `/api/user/my-courses/${enrollmentId}/orders/${orderId}/invoice`;
}

function mapMyCourseList(item: ApiObject): MyCourseListItem {
  return {
    id: String(item.course?.id || item.course_id || item.id),
    enrollmentId: String(item.enrollment_id || item.id),
    enrolledAt: item.enrolled_at || null,
    progressPercent: numberValue(item.progress_percent),
    isCompleted: Boolean(item.is_completed),
    finalExamStatus: item.final_exam_status || null,
    paymentMode: item.payment_mode || null,
    paymentModeLabel: item.payment_mode_label || null,
    course: {
      ...mapCourse(item.course || item),
      isActive: item.course?.is_active !== undefined ? Boolean(item.course.is_active) : undefined,
    },
    isAccessible: item.is_accessible !== undefined ? Boolean(item.is_accessible) : true,
    sectionsPayment: item.sections_payment || null,
    canResume: Boolean(item.can_resume),
    lastPosition: item.last_position || null,
    certificate: mapCourseCertificate(item.certificate),
    orders: asArray<ApiObject>(item.orders || []).map(mapCourseOrder),
  };
}

function mapCourseOrder(item: ApiObject): CourseOrderItem {
  return {
    id: String(item.id),
    orderType: item.order_type || null,
    orderTypeLabel: item.order_type_label || null,
    courseSectionId: item.course_section_id ?? null,
    amount: item.amount !== undefined ? numberValue(item.amount) : null,
    currency: item.currency || null,
    status: item.status || null,
    statusLabel: item.status_label || null,
    paidAt: item.paid_at || null,
    courseEnrollmentId: item.course_enrollment_id ?? null,
    invoiceDownloadUrl: item.invoice_download_url || null,
    invoice: item.invoice || null,
  };
}

function mapCourseCertificate(item: ApiObject | null | undefined): CourseCertificateItem | null {
  if (!item) return null;
  return {
    issued: item.issued !== undefined ? Boolean(item.issued) : undefined,
    certificateNumber: item.certificate_number ? String(item.certificate_number) : null,
    issuedAt: item.issued_at || null,
    downloadUrl: item.download_url || null,
  };
}

function mapMyCourseDetail(item: ApiObject): MyCourseDetail {
  const list = mapMyCourseList(item);
  return {
    ...list,
    sections: asArray<ApiObject>(item.sections || []).map(mapSection),
    finalQuiz: item.final_quiz
      ? {
          id: String(item.final_quiz.id),
          title: text(item.final_quiz.title, 'Final quiz'),
          type: item.final_quiz.type || null,
          typeLabel: item.final_quiz.type_label || null,
          passingScore: item.final_quiz.passing_score ?? null,
          isSubmitted: Boolean(item.final_quiz.is_submitted),
          isPassed: Boolean(item.final_quiz.is_passed),
          isAccessible: item.final_quiz.is_accessible !== undefined ? Boolean(item.final_quiz.is_accessible) : undefined,
        }
      : null,
    actions: item.actions
      ? {
          continueLearning: item.actions.continue_learning || null,
          payNextSection: item.actions.pay_next_section ? { sectionId: String(item.actions.pay_next_section.section_id) } : null,
          downloadCertificate: item.actions.download_certificate || null,
        }
      : undefined,
  };
}

function mapQuizStart(item: ApiObject): CourseQuizStartItem {
  return {
    id: String(item.id),
    title: text(item.title, 'Quiz'),
    type: item.type || null,
    typeLabel: item.type_label || null,
    passingScore: item.passing_score ?? null,
    questions: asArray<ApiObject>(item.questions || []).map((question) => ({
      id: String(question.id),
      question: text(question.question, 'Question'),
      choices: asArray<ApiObject>(question.choices || []).map((choice) => ({
        id: String(choice.id),
        choice: text(choice.choice, 'Choice'),
      })),
    })),
  };
}
