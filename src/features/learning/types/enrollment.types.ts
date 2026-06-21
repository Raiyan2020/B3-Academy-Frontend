export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';
export type PaymentMode = 'full' | 'installments';

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  paymentMode: PaymentMode;
  paidInstallments: number;
  totalInstallments: number;
  sectionEntitlements: string[]; // List of unlocked module/section IDs
  nextDueAt?: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
}
