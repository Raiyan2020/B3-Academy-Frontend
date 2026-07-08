export type BackendCoursePaymentMode = 'full_only' | 'full_and_per_section';
export type BackendCourseOrderType = 'full' | 'section';

export interface CourseCategory {
  id: string;
  name: string;
}

export interface CourseLevel {
  id: string;
  name: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  duration?: string | null;
  type?: string | null;
  typeLabel?: string | null;
  content?: string | null;
  videoUrl?: string | null;
  fileUrl?: string | null;
  courseQuizId?: string | null;
  isLocked?: boolean;
  isCompleted?: boolean;
  isAccessible?: boolean;
}

export interface CourseSection {
  id: string;
  title: string;
  lessons: CourseLesson[];
  position?: number | null;
  isLocked?: boolean;
  isPaid?: boolean;
  isAccessible?: boolean;
}

export interface CourseInstructor {
  name: string;
  image?: string | null;
}

export interface CoursePrice {
  amount?: number | null;
  currency?: string | null;
  rate?: number | null;
  base_amount?: number | null;
  baseAmount?: number | null;
}

export interface CourseListItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  category?: CourseCategory | null;
  level?: CourseLevel | null;
  instructor?: CourseInstructor | null;
  durationHours: number;
  price: number;
  currency: string;
  isFeatured: boolean;
  isEnrolled: boolean;
  publishedAt?: string | null;
  enrollmentStatus?: string | null;
  rawPrice?: CoursePrice | null;
}

export interface CourseCurriculumOutline {
  id: string;
  title: string;
  position?: number | null;
  isLocked?: boolean;
  lessons: CourseLesson[];
}

export interface CourseDetail extends CourseListItem {
  trailerUrl?: string | null;
  sections: CourseSection[] | CourseCurriculumOutline[];
  paymentModes: BackendCourseOrderType[];
  paymentMode?: BackendCoursePaymentMode | null;
  paymentModeLabel?: string | null;
  supportsSectionPayment?: boolean;
  supportsFullPayment?: boolean;
  installmentCount?: number | null;
  relatedCourses: CourseListItem[];
}

export interface CourseFilters {
  search?: string;
  categoryId?: string;
  levelId?: string;
  currency?: string;
  minPrice?: string;
  maxPrice?: string;
  minDurationHours?: string;
  maxDurationHours?: string;
  sort?: 'newest' | 'oldest';
}

export interface CheckoutCourseInput {
  courseId: string;
  paymentMethodId: string;
  currency: string;
  courseSectionId?: string;
  orderType: BackendCourseOrderType;
  idempotencyKey: string;
}

export interface CourseCheckoutTransaction {
  id: number | string;
  status?: string | null;
  status_label?: string | null;
  message?: string | null;
  payment_url?: string | null;
  amount?: number | null;
  currency?: string | null;
  base_amount?: number | null;
  exchange_rate?: number | null;
  course_order?: Record<string, unknown> | null;
}

export interface CourseCheckoutPreviewSection {
  id: string;
  title: string;
  amount?: number | null;
  currency?: string | null;
  isPayable?: boolean;
  isAccessible?: boolean;
  isPaid?: boolean;
  isNextPayable?: boolean;
  orderType?: BackendCourseOrderType | null;
}

export interface CourseCheckoutPreview {
  course: CourseListItem & {
    supportsFullPayment?: boolean;
    supportsSectionPayment?: boolean;
  };
  fullPrice?: CoursePrice | null;
  sections: CourseCheckoutPreviewSection[];
  supportsFullPayment: boolean;
  supportsSectionPayment: boolean;
}

export interface MyCourseListItem {
  id: string;
  enrollmentId: string;
  enrolledAt?: string | null;
  progressPercent: number;
  isCompleted: boolean;
  finalExamStatus?: Record<string, unknown> | null;
  paymentMode?: string | null;
  paymentModeLabel?: string | null;
  course: CourseListItem & { isActive?: boolean };
  isAccessible: boolean;
  sectionsPayment?: Record<string, unknown> | null;
  canResume: boolean;
  lastPosition?: Record<string, unknown> | null;
  certificate?: CourseCertificateItem | null;
  orders?: CourseOrderItem[];
}

export interface CourseCertificateItem {
  issued?: boolean;
  certificateNumber?: string | null;
  issuedAt?: string | null;
  downloadUrl?: string | null;
}

export interface CourseOrderItem {
  id: string;
  orderType?: string | null;
  orderTypeLabel?: string | null;
  courseSectionId?: string | number | null;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  paidAt?: string | null;
  courseEnrollmentId?: string | number | null;
  invoiceDownloadUrl?: string | null;
  invoice?: Record<string, unknown> | null;
}

export interface MyCourseDetail extends MyCourseListItem {
  sections: CourseSection[];
  finalQuiz?: {
    id: string;
    title: string;
    type?: string | null;
    typeLabel?: string | null;
    passingScore?: number | null;
    isSubmitted?: boolean;
    isPassed?: boolean;
    isAccessible?: boolean;
  } | null;
  actions?: {
    continueLearning?: Record<string, unknown> | null;
    payNextSection?: { sectionId: string } | null;
    downloadCertificate?: Record<string, unknown> | null;
  };
}

export interface CourseQuizQuestionItem {
  id: string;
  question: string;
  choices: { id: string; choice: string }[];
}

export interface CourseQuizStartItem {
  id: string;
  title: string;
  type?: string | null;
  typeLabel?: string | null;
  passingScore?: number | null;
  questions: CourseQuizQuestionItem[];
}

export interface CourseQuizResultItem {
  quizId?: string | number | null;
  score?: number | null;
  passingScore?: number | null;
  passed?: boolean;
  correctCount?: number | null;
  wrongCount?: number | null;
  answersReview?: unknown;
}
