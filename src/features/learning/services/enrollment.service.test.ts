import { describe, expect, it } from 'vitest';
import { addCourseEnrollment, getCourseEnrollment, payNextInstallment } from './enrollment.service';
import { evaluateCourseCompletion, getOrCreateCertificate } from './certificate.service';
import { getSectionsForInstallment } from '@/features/courses/services/courses.service';
import { markLessonComplete } from './course-progress.service';
import { saveQuizAttempt } from './quiz-attempt.service';

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

describe('certificate eligibility', () => {
  it('requires lessons, quizzes, final exam, and full payment before issuing a stable certificate', () => {
    addCourseEnrollment({
      userId: 'cert-user',
      courseId: 'c3',
      paymentMode: 'full',
      paymentId: 'pay-cert-1',
    });

    let evaluation = evaluateCourseCompletion('cert-user', 'c3');
    expect(evaluation.eligible).toBe(false);
    expect(evaluation.missing).toContain('lessons-incomplete');

    const lessons = ['c3-l1', 'c3-l2', 'c3-l3', 'c3-l4'];
    lessons.forEach((lessonId) => markLessonComplete('cert-user', 'c3', lessonId));

    saveQuizAttempt({
      userId: 'cert-user',
      courseId: 'c3',
      quizId: 'q-m1',
      submittedAnswers: {},
      score: 100,
      correctCount: 2,
      wrongCount: 0,
      passed: true,
    });
    saveQuizAttempt({
      userId: 'cert-user',
      courseId: 'c3',
      quizId: 'q-m2',
      submittedAnswers: {},
      score: 100,
      correctCount: 1,
      wrongCount: 0,
      passed: true,
    });
    saveQuizAttempt({
      userId: 'cert-user',
      courseId: 'c3',
      quizId: 'final-c3',
      submittedAnswers: {},
      score: 100,
      correctCount: 1,
      wrongCount: 0,
      passed: true,
    });

    evaluation = evaluateCourseCompletion('cert-user', 'c3');
    expect(evaluation.eligible).toBe(true);

    const first = getOrCreateCertificate({
      userId: 'cert-user',
      userName: 'Cert User',
      courseId: 'c3',
      courseTitle: 'Psychomycology',
      instructorName: 'Instructor',
    });
    const second = getOrCreateCertificate({
      userId: 'cert-user',
      userName: 'Cert User',
      courseId: 'c3',
      courseTitle: 'Psychomycology',
      instructorName: 'Instructor',
    });

    expect(first?.id).toBe('B3-CERT-C3-cert-user');
    expect(second?.id).toBe(first?.id);
  });
});
