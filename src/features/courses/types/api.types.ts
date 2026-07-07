export type CoursePaymentMode = 'full' | 'installments';

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
}

export interface CourseSection {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface CourseInstructor {
  name: string;
  image?: string | null;
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
}

export interface CourseDetail extends CourseListItem {
  trailerUrl?: string | null;
  sections: CourseSection[];
  paymentModes: CoursePaymentMode[];
  installmentCount?: number | null;
  relatedCourses: CourseListItem[];
}

export interface CourseFilters {
  search?: string;
  categoryId?: string;
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
  paymentMode: CoursePaymentMode;
  installmentNumber?: number;
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
}

