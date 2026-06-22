'use client';

import { jsPDF } from 'jspdf';
import { addNotification } from '@/features/account/services/account-records.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import { getCourseMetadata, getCourseRecord } from '@/features/courses/services/courses.service';
import { getCourseEnrollment } from './enrollment.service';
import { getCourseProgress, getAccessibleLessons } from './course-progress.service';
import { areAllModuleQuizzesPassed, hasPassedQuiz } from './quiz-attempt.service';
import type { CertificateRecord } from '../types/certificate.types';

const CERTIFICATES_KEY = 'b3-course-certificates';

export interface CourseCompletionEvaluation {
  eligible: boolean;
  requirements: {
    lessonsComplete: boolean;
    moduleQuizzesPassed: boolean;
    finalExamPassed: boolean;
    installmentsPaid: boolean;
    certificateEnabled: boolean;
  };
  missing: string[];
}

export function evaluateCourseCompletion(userId: string, courseId: string): CourseCompletionEvaluation {
  const course = getCourseRecord(courseId);
  const metadata = getCourseMetadata(courseId);
  const enrollment = getCourseEnrollment(userId, courseId);
  const progress = getCourseProgress(userId, courseId);

  const accessibleLessons = getAccessibleLessons(userId, courseId);
  const lessonsComplete =
    accessibleLessons.length > 0 &&
    accessibleLessons.every((lesson) => progress.completedLessonIds.includes(lesson.id));

  const moduleQuizzesPassed = areAllModuleQuizzesPassed(userId, courseId);
  const finalExamPassed = course?.finalExam ? hasPassedQuiz(userId, course.finalExam.id) : true;
  const installmentsPaid = enrollment
    ? enrollment.paymentMode === 'full' || enrollment.paidInstallments >= enrollment.totalInstallments
    : false;
  const certificateEnabled = metadata?.certificateEnabled ?? false;

  const missing: string[] = [];
  if (!certificateEnabled) missing.push('certificate-disabled');
  if (!lessonsComplete) missing.push('lessons-incomplete');
  if (!moduleQuizzesPassed) missing.push('module-quizzes-incomplete');
  if (!finalExamPassed) missing.push('final-exam-incomplete');
  if (!installmentsPaid) missing.push('installments-unpaid');

  const eligible =
    certificateEnabled && lessonsComplete && moduleQuizzesPassed && finalExamPassed && installmentsPaid;

  return {
    eligible,
    requirements: {
      lessonsComplete,
      moduleQuizzesPassed,
      finalExamPassed,
      installmentsPaid,
      certificateEnabled,
    },
    missing,
  };
}

export function getCertificates(userId?: string) {
  const all = readLocalStorageJson<CertificateRecord[]>(CERTIFICATES_KEY, []);
  return userId ? all.filter((certificate) => certificate.userId === userId) : all;
}

function buildStableCertificateId(userId: string, courseId: string) {
  return `B3-CERT-${courseId.toUpperCase()}-${userId}`;
}

export function getOrCreateCertificate(input: {
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
}) {
  const evaluation = evaluateCourseCompletion(input.userId, input.courseId);
  if (!evaluation.eligible) return null;

  const existing = getCertificates(input.userId).find((certificate) => certificate.courseId === input.courseId);
  if (existing) return existing;

  const issuedAt = new Date().toISOString();
  const id = buildStableCertificateId(input.userId, input.courseId);
  const certificate: CertificateRecord = {
    id,
    ...input,
    issuedAt,
    downloadUrl: createCertificateDataUrl({
      id,
      issuedAt,
      userName: input.userName,
      courseTitle: input.courseTitle,
      instructorName: input.instructorName,
    }),
  };
  writeLocalStorageJson(CERTIFICATES_KEY, [certificate, ...getCertificates()]);
  addNotification({
    userId: input.userId,
    title: 'تم إصدار شهادة الدورة',
    body: `تم إصدار شهادة ${input.courseTitle}.`,
    href: '/dashboard/courses',
  });
  return certificate;
}

function createCertificateDataUrl(input: {
  id: string;
  issuedAt: string;
  userName: string;
  courseTitle: string;
  instructorName: string;
}) {
  const formattedDate = new Date(input.issuedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(8);
  doc.rect(24, 24, pageWidth - 48, pageHeight - 48);

  doc.setLineWidth(1);
  doc.setDrawColor(167, 243, 208);
  doc.rect(36, 36, pageWidth - 72, pageHeight - 72);

  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('B3 Academy', pageWidth / 2, 90, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(4, 120, 87);
  doc.text('Certificate of Completion', pageWidth / 2, 112, { align: 'center' });

  doc.setDrawColor(4, 120, 87);
  doc.line(pageWidth / 2 - 40, 122, pageWidth / 2 + 40, 122);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('This certificate is proudly presented to', pageWidth / 2, 160, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(6, 78, 59);
  doc.text(input.userName, pageWidth / 2, 195, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('For successfully completing the course:', pageWidth / 2, 225, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const courseLines = doc.splitTextToSize(input.courseTitle, pageWidth - 160);
  doc.text(courseLines, pageWidth / 2, 250, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`Instructor: ${input.instructorName}`, pageWidth / 2, 290, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('Issue Date', 80, pageHeight - 70);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(formattedDate, 80, pageHeight - 55);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Certificate ID', pageWidth - 80, pageHeight - 70, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(input.id, pageWidth - 80, pageHeight - 55, { align: 'right' });

  doc.setFillColor(6, 78, 59);
  doc.circle(pageWidth / 2, pageHeight - 62, 22, 'F');
  doc.setTextColor(167, 243, 208);
  doc.setFontSize(18);
  doc.text('*', pageWidth / 2, pageHeight - 56, { align: 'center' });

  return doc.output('datauristring');
}
