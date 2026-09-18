import { apiFetch } from '@/lib/api/base-fetch';
import { ApiObject, Paginated, asArray, asObject, asObjectArray, asObjectOrNull, nullableNumber, nullableText, text } from '@/lib/api/payload';
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

/** A string or number id/key field the backend may send as either. */
function nullableStringOrNumber(value: unknown): string | number | null {
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

function cleanCourseId(id: string | number): string {
  const str = String(id);
  if (str.startsWith('c')) {
    const numPart = str.slice(1);
    if (/^\d+$/.test(numPart)) return numPart;
  }
  return str;
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
    duration: nullableText(item.duration ?? item.duration_label),
    type: nullableText(item.type ?? item.content_type),
    typeLabel: nullableText(item.type_label),
    content: nullableText(item.content),
    videoUrl: nullableText(item.video_url),
    fileUrl: nullableText(item.file_url),
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
    position: nullableNumber(item.position),
    lessons: asObjectArray(item.lessons ?? item.items).map(mapLesson),
    isLocked: Boolean(item.is_locked),
    isPaid: item.is_paid !== undefined ? Boolean(item.is_paid) : undefined,
    isAccessible: item.is_accessible !== undefined ? Boolean(item.is_accessible) : undefined,
  };
}

function mapCurriculumOutline(item: ApiObject): CourseCurriculumOutline {
  return {
    id: String(item.id),
    title: text(item.title || item.name, 'Section'),
    position: nullableNumber(item.position),
    isLocked: Boolean(item.is_locked),
    lessons: asObjectArray(item.lessons).map(mapLesson),
  };
}

function mapCheckoutPreviewSection(item: ApiObject): CourseCheckoutPreviewSection {
  const price = item.price && typeof item.price === 'object' ? (item.price as ApiObject) : null;

  return {
    id: String(item.id),
    title: text(item.title || item.name, 'Section'),
    // The checkout-preview payload nests each section's money under `price`
    // (`{id, name, price: {amount, rate, currency}}`), exactly like `full_price` above.
    // Reading only the flat `item.amount`/`item.currency` therefore produced null for
    // every section, so the checkout listed each one's price as "-" and a buyer choosing
    // per-section payment never saw what that section costs. The flat shape is kept as a
    // fallback because other course endpoints do return it that way.
    amount: price?.amount !== undefined ? numberValue(price.amount) : (item.amount !== undefined ? numberValue(item.amount) : null),
    currency: nullableText(price?.currency ?? item.currency),
    isPayable: item.is_payable !== undefined ? Boolean(item.is_payable) : undefined,
    isAccessible: item.is_accessible !== undefined ? Boolean(item.is_accessible) : undefined,
    isPaid: item.is_paid !== undefined ? Boolean(item.is_paid) : undefined,
    isNextPayable: item.is_next_payable !== undefined ? Boolean(item.is_next_payable) : undefined,
    orderType: nullableText(item.order_type) as CourseCheckoutPreviewSection['orderType'],
  };
}

function mapCourse(item: ApiObject): CourseListItem {
  const category = item.category
    ? mapCategory(asObject(item.category))
    : item.category_id
      ? { id: String(item.category_id), name: text(item.category_name, '') }
      : null;
  const level = item.level
    ? mapLevel(asObject(item.level))
    : item.level_id
      ? { id: String(item.level_id), name: text(item.level_name, '') }
      : null;
  const price = mapPrice(item);

  const rawId = item.id !== undefined && item.id !== null ? String(item.id) : '';
  const mappedId = rawId ? (rawId.startsWith('c') ? rawId : `c${rawId}`) : '';

  const instructor = asObject(item.instructor);

  return {
    id: mappedId,
    title: text(item.name || item.title, 'Course'),
    description: text(item.short_description || item.description || item.summary, ''),
    imageUrl: nullableText(item.image ?? item.image_url ?? item.thumbnail ?? item.cover),
    category,
    level,
    instructor: item.instructor
      ? { name: text(instructor.name || item.instructor), image: nullableText(instructor.image) }
      : item.instructor_name
        ? { name: text(item.instructor_name), image: null }
        : null,
    durationHours: numberValue(item.hours ?? item.duration_hours ?? item.total_hours),
    price: numberValue(price?.amount ?? item.converted_price ?? item.price),
    currency: String(price?.currency || item.currency || item.base_currency || 'USD'),
    isFeatured: Boolean(item.is_featured ?? item.featured),
    isEnrolled: String(item.enrollment_status || '').toLowerCase() === 'enrolled' || Boolean(item.is_enrolled ?? item.is_owned ?? item.enrolled),
    publishedAt: nullableText(item.published_at ?? item.created_at),
    enrollmentStatus: nullableText(item.enrollment_status),
    rawPrice: price,
  };
}

function mapCourseDetail(item: ApiObject): CourseDetail {
  const sections = asObjectArray(item.curriculum_outline ?? item.sections ?? item.modules ?? item.curriculum).map(
    item.curriculum_outline ? mapCurriculumOutline : mapSection,
  );
  const paymentMode = (item.payment_mode || null) as CourseDetail['paymentMode'];
  const supportsSectionPayment = Boolean(item.supports_section_payment || paymentMode === 'full_and_per_section');

  return {
    ...mapCourse(item),
    trailerUrl: nullableText(item.intro_video ?? item.trailer_url ?? item.video_url),
    sections,
    paymentModes: supportsSectionPayment ? ['full', 'section'] : ['full'],
    paymentMode,
    paymentModeLabel: nullableText(item.payment_mode_label),
    supportsFullPayment: item.supports_full_payment !== undefined ? Boolean(item.supports_full_payment) : true,
    supportsSectionPayment,
    installmentCount: nullableNumber(item.installment_count ?? item.installments_count),
    relatedCourses: asObjectArray(item.similar_courses ?? item.related_courses ?? item.related).map(mapCourse),
    isFavorited: Boolean(item.is_favorited),
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
  const response = await apiFetch<ApiObject>(`/api/user/courses/${cleanCourseId(courseId)}/checkout-preview`, {
    query: { currency },
  });
  const courseSource = response.course ?? response.course_data;
  return {
    course: mapCourse(courseSource ? asObject(courseSource) : response),
    fullPrice: response.full_price ? mapPrice({ price: response.full_price, currency: response.currency }) : mapPrice(response),
    sections: asObjectArray(response.sections).map(mapCheckoutPreviewSection),
    supportsFullPayment: Boolean(response.supports_full_payment),
    supportsSectionPayment: Boolean(response.supports_section_payment),
  } satisfies CourseCheckoutPreview;
}

export async function getCourseDetail(id: string, currency = 'USD') {
  const response = await apiFetch<ApiObject>(`/api/user/courses/${cleanCourseId(id)}`, {
    query: { currency },
  });
  return mapCourseDetail(response);
}

export async function getMyCourses() {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/my-courses');
  return asArray(response).map(mapMyCourseList);
}

export async function checkoutCourse(input: CheckoutCourseInput): Promise<CourseCheckoutTransaction> {
  return apiFetch<CourseCheckoutTransaction>(`/api/user/courses/${cleanCourseId(input.courseId)}/checkout`, {
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
  const courseSource = asObject(item.course);
  const rawCourseId = String(courseSource.id || item.course_id || item.id || '');
  const courseId = rawCourseId ? (rawCourseId.startsWith('c') ? rawCourseId : `c${rawCourseId}`) : '';

  return {
    id: courseId,
    enrollmentId: String(item.enrollment_id || item.id),
    enrolledAt: nullableText(item.enrolled_at),
    progressPercent: numberValue(item.progress_percent),
    isCompleted: Boolean(item.is_completed),
    finalExamStatus: asObjectOrNull(item.final_exam_status),
    paymentMode: nullableText(item.payment_mode),
    paymentModeLabel: nullableText(item.payment_mode_label),
    course: {
      ...mapCourse(item.course ? courseSource : item),
      isActive: courseSource.is_active !== undefined ? Boolean(courseSource.is_active) : undefined,
    },
    isAccessible: item.is_accessible !== undefined ? Boolean(item.is_accessible) : true,
    sectionsPayment: asObjectOrNull(item.sections_payment),
    canResume: Boolean(item.can_resume),
    lastPosition: asObjectOrNull(item.last_position),
    certificate: mapCourseCertificate(asObjectOrNull(item.certificate)),
    orders: asObjectArray(item.orders).map(mapCourseOrder),
  };
}

function mapCourseOrder(item: ApiObject): CourseOrderItem {
  return {
    id: String(item.id),
    orderType: nullableText(item.order_type),
    orderTypeLabel: nullableText(item.order_type_label),
    courseSectionId: nullableStringOrNumber(item.course_section_id),
    amount: item.amount !== undefined ? numberValue(item.amount) : null,
    currency: nullableText(item.currency),
    status: nullableText(item.status),
    statusLabel: nullableText(item.status_label),
    paidAt: nullableText(item.paid_at),
    courseEnrollmentId: nullableStringOrNumber(item.course_enrollment_id),
    invoiceDownloadUrl: nullableText(item.invoice_download_url),
    invoice: asObjectOrNull(item.invoice),
  };
}

function mapCourseCertificate(item: ApiObject | null | undefined): CourseCertificateItem | null {
  if (!item) return null;
  return {
    issued: item.issued !== undefined ? Boolean(item.issued) : undefined,
    certificateNumber: item.certificate_number ? String(item.certificate_number) : null,
    issuedAt: nullableText(item.issued_at),
    downloadUrl: nullableText(item.download_url),
  };
}

function mapMyCourseDetail(item: ApiObject): MyCourseDetail {
  const list = mapMyCourseList(item);
  const finalQuiz = asObject(item.final_quiz);
  const actions = asObject(item.actions);
  const payNextSection = asObjectOrNull(actions.pay_next_section);
  return {
    ...list,
    sections: asObjectArray(item.sections).map(mapSection),
    finalQuiz: item.final_quiz
      ? {
          id: String(finalQuiz.id),
          title: text(finalQuiz.title, 'Final quiz'),
          type: nullableText(finalQuiz.type),
          typeLabel: nullableText(finalQuiz.type_label),
          passingScore: nullableNumber(finalQuiz.passing_score),
          isSubmitted: Boolean(finalQuiz.is_submitted),
          isPassed: Boolean(finalQuiz.is_passed),
          isAccessible: finalQuiz.is_accessible !== undefined ? Boolean(finalQuiz.is_accessible) : undefined,
        }
      : null,
    actions: item.actions
      ? {
          continueLearning: asObjectOrNull(actions.continue_learning),
          payNextSection: payNextSection ? { sectionId: String(payNextSection.section_id) } : null,
          downloadCertificate: asObjectOrNull(actions.download_certificate),
        }
      : undefined,
  };
}

function mapQuizStart(item: ApiObject): CourseQuizStartItem {
  return {
    id: String(item.id),
    title: text(item.title, 'Quiz'),
    type: nullableText(item.type),
    typeLabel: nullableText(item.type_label),
    passingScore: nullableNumber(item.passing_score),
    questions: asObjectArray(item.questions).map((question) => ({
      id: String(question.id),
      question: text(question.question, 'Question'),
      choices: asObjectArray(question.choices).map((choice) => ({
        id: String(choice.id),
        choice: text(choice.choice, 'Choice'),
      })),
    })),
  };
}
