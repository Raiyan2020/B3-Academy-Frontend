'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { CourseEnrollment, PaymentMode } from '../types/enrollment.types';
import {
  getCourseRecord,
  getCourseInstallmentConfig,
  getSectionsForInstallment,
  supportsPaymentMode,
} from '@/features/courses/services/courses.service';
import { addNotification } from '@/features/account/services/account-records.service';

const ENROLLMENTS_KEY = 'b3-course-enrollments';

function resolveTotalInstallments(courseId: string, paymentMode: PaymentMode): number {
  if (paymentMode !== 'installments') return 1;
  return getCourseInstallmentConfig(courseId)?.count ?? 1;
}

export function getAllEnrollments(): CourseEnrollment[] {
  return readLocalStorageJson<CourseEnrollment[]>(ENROLLMENTS_KEY, []).map((enrollment) => ({
    ...enrollment,
    processedPaymentIds: enrollment.processedPaymentIds ?? [],
  }));
}

export function getCourseEnrollment(userId: string, courseId: string): CourseEnrollment | null {
  return getAllEnrollments().find((enrollment) => enrollment.userId === userId && enrollment.courseId === courseId) || null;
}

export function getCourseEnrollments(userId: string): CourseEnrollment[] {
  return getAllEnrollments().filter((enrollment) => enrollment.userId === userId);
}

export function addCourseEnrollment(input: {
  userId: string;
  courseId: string;
  paymentMode: PaymentMode;
  paymentId?: string;
}) {
  const existing = getCourseEnrollment(input.userId, input.courseId);
  if (existing) return existing;

  if (!supportsPaymentMode(input.courseId, input.paymentMode)) {
    throw new Error('Payment mode is not supported for this course.');
  }

  const course = getCourseRecord(input.courseId);
  const totalInstallments = resolveTotalInstallments(input.courseId, input.paymentMode);
  const sectionEntitlements = getSectionsForInstallment(input.courseId, 1, input.paymentMode);

  const enrollment: CourseEnrollment = {
    id: `enroll-${Date.now()}`,
    userId: input.userId,
    courseId: input.courseId,
    paymentMode: input.paymentMode,
    paidInstallments: 1,
    totalInstallments,
    sectionEntitlements,
    processedPaymentIds: input.paymentId ? [input.paymentId] : [],
    nextDueAt:
      input.paymentMode === 'installments'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    status: 'active',
    enrolledAt: new Date().toISOString(),
  };

  const all = getAllEnrollments();
  writeLocalStorageJson(ENROLLMENTS_KEY, [enrollment, ...all]);

  addNotification({
    userId: input.userId,
    title: 'تم التسجيل في الدورة',
    body: `تم تسجيلك بنجاح في دورة: ${course ? course.title.ar : input.courseId}.`,
    href: '/dashboard/courses',
  });

  return enrollment;
}

export type PayNextInstallmentResult =
  | { ok: true; enrollment: CourseEnrollment }
  | { ok: false; error: 'not-enrolled' | 'already-paid' | 'duplicate-payment' | 'not-installment-plan' };

export function payNextInstallment(
  userId: string,
  courseId: string,
  paymentId?: string,
): PayNextInstallmentResult {
  const all = getAllEnrollments();
  const index = all.findIndex((enrollment) => enrollment.userId === userId && enrollment.courseId === courseId);
  if (index < 0) return { ok: false, error: 'not-enrolled' };

  const current = all[index];
  if (current.paymentMode !== 'installments') return { ok: false, error: 'not-installment-plan' };
  if (current.paidInstallments >= current.totalInstallments) return { ok: false, error: 'already-paid' };
  if (paymentId && current.processedPaymentIds.includes(paymentId)) {
    return { ok: false, error: 'duplicate-payment' };
  }

  const paid = current.paidInstallments + 1;
  const sectionEntitlements = getSectionsForInstallment(courseId, paid, current.paymentMode);

  const updated: CourseEnrollment = {
    ...current,
    paidInstallments: paid,
    sectionEntitlements,
    processedPaymentIds: paymentId ? [...current.processedPaymentIds, paymentId] : current.processedPaymentIds,
    nextDueAt:
      paid < current.totalInstallments
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
  };

  const next = [...all];
  next[index] = updated;
  writeLocalStorageJson(ENROLLMENTS_KEY, next);
  return { ok: true, enrollment: updated };
}

/** @deprecated Use payNextInstallment */
export function payCourseInstallment(userId: string, courseId: string) {
  const result = payNextInstallment(userId, courseId);
  return result.ok ? result.enrollment : null;
}
