import { describe, expect, it } from 'vitest';
import { addCourseEnrollment, getCourseEnrollment, payNextInstallment } from './enrollment.service';
import { getSectionsForInstallment } from '@/features/courses/services/courses.service';

describe('course enrollment installments', () => {
  it('unlocks configured sections on first installment enrollment', () => {
    const enrollment = addCourseEnrollment({
      userId: 'user-1',
      courseId: 'c1',
      paymentMode: 'installments',
      paymentId: 'pay-1',
    });

    expect(enrollment.paidInstallments).toBe(1);
    expect(enrollment.sectionEntitlements).toEqual(getSectionsForInstallment('c1', 1, 'installments'));
    expect(enrollment.processedPaymentIds).toEqual(['pay-1']);
  });

  it('advances entitlements on payNextInstallment and blocks duplicate payments', () => {
    addCourseEnrollment({
      userId: 'user-2',
      courseId: 'c1',
      paymentMode: 'installments',
      paymentId: 'pay-2',
    });

    const second = payNextInstallment('user-2', 'c1', 'pay-3');
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.enrollment.paidInstallments).toBe(2);
      expect(second.enrollment.sectionEntitlements).toEqual(getSectionsForInstallment('c1', 2, 'installments'));
    }

    const duplicate = payNextInstallment('user-2', 'c1', 'pay-3');
    expect(duplicate).toEqual({ ok: false, error: 'duplicate-payment' });
  });

  it('unlocks all sections after final installment for full mapping', () => {
    addCourseEnrollment({
      userId: 'user-3',
      courseId: 'c1',
      paymentMode: 'installments',
      paymentId: 'pay-4',
    });

    let enrollment = getCourseEnrollment('user-3', 'c1');
    while (enrollment && enrollment.paidInstallments < enrollment.totalInstallments) {
      const result = payNextInstallment('user-3', 'c1', `pay-next-${enrollment.paidInstallments}`);
      expect(result.ok).toBe(true);
      enrollment = getCourseEnrollment('user-3', 'c1');
    }

    expect(enrollment?.sectionEntitlements).toEqual(['m1', 'm2']);
  });
});
