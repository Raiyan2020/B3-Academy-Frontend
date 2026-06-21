'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { CourseEnrollment, PaymentMode } from '../types/enrollment.types';
import { getCourseById } from '@/features/courses/services/courses.service';
import { addNotification } from '@/features/account/services/account-records.service';

const ENROLLMENTS_KEY = 'b3-course-enrollments';

export function getAllEnrollments(): CourseEnrollment[] {
  return readLocalStorageJson<CourseEnrollment[]>(ENROLLMENTS_KEY, []);
}

export function getCourseEnrollment(userId: string, courseId: string): CourseEnrollment | null {
  return getAllEnrollments().find((e) => e.userId === userId && e.courseId === courseId) || null;
}

export function getCourseEnrollments(userId: string): CourseEnrollment[] {
  return getAllEnrollments().filter((e) => e.userId === userId);
}

export function addCourseEnrollment(input: {
  userId: string;
  courseId: string;
  paymentMode: PaymentMode;
}) {
  const existing = getCourseEnrollment(input.userId, input.courseId);
  if (existing) return existing;

  const course = getCourseById(input.courseId);
  const totalModules = course?.modules?.length || 0;
  const moduleIds = course?.modules?.map(m => m.id) || [];

  // Entitlements: if full payment, unlock all. If installments, unlock 1st installment's ratio of modules.
  let sectionEntitlements: string[] = [];
  if (input.paymentMode === 'full') {
    sectionEntitlements = moduleIds;
  } else {
    // 1st installment paid of 6
    const countToUnlock = Math.max(1, Math.ceil((1 / 6) * totalModules));
    sectionEntitlements = moduleIds.slice(0, countToUnlock);
  }

  const enrollment: CourseEnrollment = {
    id: `enroll-${Date.now()}`,
    userId: input.userId,
    courseId: input.courseId,
    paymentMode: input.paymentMode,
    paidInstallments: input.paymentMode === 'installments' ? 1 : 1,
    totalInstallments: input.paymentMode === 'installments' ? 6 : 1,
    sectionEntitlements,
    nextDueAt: input.paymentMode === 'installments' 
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

export function payCourseInstallment(userId: string, courseId: string) {
  const all = getAllEnrollments();
  let updated: CourseEnrollment | null = null;

  const next = all.map((e) => {
    if (e.userId !== userId || e.courseId !== courseId) return e;

    const course = getCourseById(courseId);
    const totalModules = course?.modules?.length || 0;
    const moduleIds = course?.modules?.map(m => m.id) || [];
    
    const paid = Math.min(e.totalInstallments, e.paidInstallments + 1);
    
    // Recalculate entitlements
    let sectionEntitlements = e.sectionEntitlements;
    if (paid === e.totalInstallments) {
      sectionEntitlements = moduleIds;
    } else {
      const countToUnlock = Math.max(1, Math.ceil((paid / e.totalInstallments) * totalModules));
      sectionEntitlements = moduleIds.slice(0, countToUnlock);
    }

    updated = {
      ...e,
      paidInstallments: paid,
      sectionEntitlements,
      nextDueAt: paid < e.totalInstallments 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        : undefined,
    };
    return updated;
  });

  if (updated) {
    writeLocalStorageJson(ENROLLMENTS_KEY, next);
  }
  return updated;
}
