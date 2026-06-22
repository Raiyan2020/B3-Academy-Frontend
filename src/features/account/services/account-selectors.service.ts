'use client';

import type { LocalizedString } from '../../../../types';
import { getFavorites, getNotifications } from './account-records.service';
import { getCourseEnrollments } from '@/features/learning/services/enrollment.service';
import { getCourseById } from '@/features/courses/services/courses.service';
import { isLessonComplete } from '@/features/learning/services/course-progress.service';
import { getBookPurchases } from '@/features/books/services/book-purchase.service';
import { getBookById } from '@/features/books/services/books.service';
import {
  getStoredClinicBookings,
  getStoredConsultations,
  getStoredPackageSessions,
  getStoredTripPurchases,
} from '@/features/care/services/care-records-storage.service';
import { getClinicById, getClinicByIdIncludingInactive, getTripPackageById } from '@/features/care/services/care-data.service';
import { getPaymentRecords } from '@/features/payments/services/payments-storage.service';
import { getSubscriptionHistory } from '@/features/subscriptions/services/subscription-history.service';
import { getLatestNewsletterSubscription } from '@/features/newsletter/services/newsletter-storage.service';
import { getPortalState } from '@/features/care/services/portal-eligibility.service';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';

function formatDate(value: string, locale = 'ar-EG') {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(locale);
}

function formatStatus(status: string, isAr = true) {
  const labels: Record<string, { ar: string; en: string }> = {
    scheduled: { ar: 'قادمة', en: 'Scheduled' },
    purchased: { ar: 'تم الشراء', en: 'Purchased' },
    completed: { ar: 'مكتملة', en: 'Completed' },
    cancelled: { ar: 'ملغاة', en: 'Cancelled' },
    successful: { ar: 'ناجحة', en: 'Successful' },
    failed: { ar: 'فاشلة', en: 'Failed' },
    active: { ar: 'فعّال', en: 'Active' },
    expired: { ar: 'منتهي', en: 'Expired' },
    confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  };
  const label = labels[status];
  return label ? (isAr ? label.ar : label.en) : status;
}

export interface AccountCourseItem {
  id: string;
  courseId: string;
  title: LocalizedString;
  paymentMode: string;
  paidInstallments: number;
  totalInstallments: number;
  completedLessons: number;
  totalLessons: number;
  isCertificateUnlocked: boolean;
  href: string;
}

export interface AccountBookItem {
  id: string;
  bookId: string;
  title: LocalizedString;
  format: string;
  shipmentStatus: string;
  shippingAddressLabel?: string;
  price?: number;
  currency?: string;
  readerHref?: string;
  detailHref: string;
  isAvailable: boolean;
}

export interface AccountClinicBookingItem {
  id: string;
  serviceName: LocalizedString;
  doctorName: LocalizedString;
  clinicName?: LocalizedString;
  date: string;
  time: string;
  duration?: number;
  location: string;
  statusLabel: string;
  paymentStatus?: string;
  href: string;
  isAvailable: boolean;
  isUpcoming: boolean;
}

export interface AccountConsultationItem {
  id: string;
  serviceName: LocalizedString;
  doctorName: LocalizedString;
  date: string;
  time: string;
  duration?: number;
  kind: string;
  statusLabel: string;
  remainingSessions?: number;
  sessionCount?: number;
  detailHref: string;
  portalHref?: string;
  portalState?: string;
  packageId?: string;
  doctorId: string;
  isUpcoming: boolean;
}

export interface AccountTripItem {
  id: string;
  tripId: string;
  title: LocalizedString;
  place: LocalizedString;
  image?: string;
  durationDays?: number;
  features?: LocalizedString[];
  price?: number;
  currency?: string;
  purchasedAt: string;
  statusLabel: string;
  coordinationNote: string;
  invoiceHref?: string;
  isAvailable: boolean;
}

export interface AccountPaymentItem {
  id: string;
  itemName: string;
  kind: string;
  createdAt: string;
  amount: number;
  currency: string;
  statusLabel: string;
  invoiceHref?: string;
  retryHref?: string;
}

export interface AccountSubscriptionView {
  isActive: boolean;
  expiryDate?: string;
  currentPlan?: {
    planName: string;
    amount: number;
    currency: string;
    startedAt: string;
    expiresAt: string;
    statusLabel: string;
    invoiceHref?: string;
  };
  history: Array<{
    id: string;
    planName: string;
    startedAt: string;
    expiresAt: string;
    amount: number;
    currency: string;
    statusLabel: string;
  }>;
}

export interface AccountFavoriteItem {
  id: string;
  title: string;
  kind: string;
  href: string;
  isAvailable: boolean;
  requiresSubscription?: boolean;
  catalogUnavailable?: boolean;
  subscriptionExpired?: boolean;
}

export interface AccountNotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  href?: string;
}

export interface AccountNewsletterView {
  status: string;
  email?: string;
}

function getCheckoutRetryUrl(kind: string, itemId: string) {
  if (kind === 'course-full' || kind === 'course-installment') return `/checkout/course/${itemId}`;
  if (kind === 'subscription-plan') return `/checkout/subscription/${itemId}`;
  if (kind === 'book-ebook') return `/checkout/book/${itemId}/ebook`;
  if (kind === 'book-print') return `/checkout/book/${itemId}/physical`;
  if (kind === 'book-bundle') return `/checkout/book/${itemId}/bundle`;
  if (kind === 'clinic-appointment') return `/checkout/clinic-appointment/${itemId}`;
  if (kind === 'consultation-session') return `/checkout/consultation-session/${itemId}`;
  if (kind === 'consultation-package') return `/checkout/consultation-package/${itemId}`;
  if (kind === 'trip-package') return `/checkout/trip-package/${itemId}`;
  return `/checkout/course/${itemId}`;
}

export function selectAccountCourses(userId: string, userQuizIds: string[] = []): AccountCourseItem[] {
  return getCourseEnrollments(userId).flatMap((enrollment) => {
    const course = getCourseById(enrollment.courseId);
    if (!course) return [];
    const lessons = course.modules.flatMap((module) => module.lessons);
    const completedLessons = lessons.filter((lesson) => isLessonComplete(userId, course.id, lesson.id)).length;
    const finalExamPassed = course.finalExam ? userQuizIds.includes(course.finalExam.id) : true;
    const isFullyPaid = enrollment.paidInstallments >= enrollment.totalInstallments;
    const isCertificateUnlocked = completedLessons === lessons.length && finalExamPassed && isFullyPaid;
    return [{
      id: enrollment.id,
      courseId: course.id,
      title: course.title,
      paymentMode: enrollment.paymentMode,
      paidInstallments: enrollment.paidInstallments,
      totalInstallments: enrollment.totalInstallments,
      completedLessons,
      totalLessons: lessons.length,
      isCertificateUnlocked,
      href: `/learn/${course.id}`,
    }];
  });
}

export function selectAccountBooks(userId: string): AccountBookItem[] {
  return getBookPurchases(userId).map((purchase) => {
    const book = getBookById(purchase.bookId);
    return {
      id: purchase.id,
      bookId: purchase.bookId,
      title: book?.title ?? { ar: 'كتاب غير متاح', en: 'Unavailable book' },
      format: purchase.format,
      shipmentStatus: purchase.status,
      shippingAddressLabel: purchase.shippingAddressLabel,
      price: purchase.price,
      currency: purchase.currency,
      readerHref: purchase.format === 'ebook' || purchase.format === 'bundle' ? `/read/${purchase.bookId}` : undefined,
      detailHref: `/books/${purchase.bookId}`,
      isAvailable: Boolean(book),
    };
  });
}

export function selectAccountClinicBookings(userId: string): AccountClinicBookingItem[] {
  return getStoredClinicBookings(userId).map((booking) => {
    const clinic = getClinicByIdIncludingInactive(booking.clinicId);
    const isUpcoming = booking.status === 'scheduled';
    return {
      id: booking.id,
      serviceName: booking.serviceName,
      doctorName: booking.doctorName,
      clinicName: clinic?.name,
      date: booking.date,
      time: booking.time,
      duration: booking.duration,
      location: booking.location,
      statusLabel: formatStatus(booking.status),
      paymentStatus: booking.paymentId ? 'مدفوع' : undefined,
      href: `/clinic-booking/${booking.id}`,
      isAvailable: Boolean(clinic?.isActive),
      isUpcoming,
    };
  });
}

export function selectAccountConsultations(userId: string): AccountConsultationItem[] {
  return getStoredConsultations(userId).map((record) => ({
    id: record.id,
    serviceName: record.serviceName,
    doctorName: record.doctorName,
    date: record.date,
    time: record.time,
    duration: record.duration,
    kind: record.kind,
    statusLabel: record.kind === 'package'
      ? `باقة (${record.sessionCount ?? 0} جلسات · ${record.remainingSessions ?? 0} متبقية)`
      : formatStatus(record.status),
    remainingSessions: record.remainingSessions,
    sessionCount: record.sessionCount,
    detailHref: `/consultation/${record.id}`,
    portalHref: record.portalHref ?? (record.kind === 'individual-text' ? `/consultation/${record.id}/chat` : undefined),
    portalState: record.kind === 'package' ? undefined : getPortalState(record),
    packageId: record.packageId,
    doctorId: record.doctorId,
    isUpcoming: record.kind === 'package'
      ? record.status !== 'completed' && record.status !== 'cancelled'
      : record.status === 'scheduled' || record.status === 'purchased',
  }));
}

export function selectAccountPackageSessions(userId: string, packageId: string) {
  return getStoredPackageSessions(userId).filter((session) => session.packageId === packageId);
}

export function selectAccountTrips(userId: string): AccountTripItem[] {
  return getStoredTripPurchases(userId).map((trip) => {
    const catalogTrip = getTripPackageById(trip.tripId);
    const payment = trip.paymentId
      ? getPaymentRecords(userId).find((record) => record.id === trip.paymentId)
      : undefined;
    return {
      id: trip.id,
      tripId: trip.tripId,
      title: trip.title,
      place: trip.place,
      image: trip.image ?? catalogTrip?.image,
      durationDays: trip.durationDays ?? catalogTrip?.durationDays,
      features: trip.features ?? catalogTrip?.features,
      price: trip.price,
      currency: trip.currency ?? payment?.currency,
      purchasedAt: formatDate(trip.purchasedAt),
      statusLabel: formatStatus(trip.status),
      coordinationNote: trip.coordinationNote.ar,
      invoiceHref: payment?.status === 'successful' && payment.invoice ? payment.invoice.downloadUrl : undefined,
      isAvailable: Boolean(catalogTrip),
    };
  });
}

export function selectAccountPayments(userId: string): AccountPaymentItem[] {
  return getPaymentRecords(userId).map((payment) => ({
    id: payment.id,
    itemName: payment.itemName,
    kind: payment.kind,
    createdAt: formatDate(payment.createdAt),
    amount: payment.amount,
    currency: payment.currency,
    statusLabel: formatStatus(payment.status),
    invoiceHref: payment.status === 'successful' && payment.invoice ? payment.invoice.downloadUrl : undefined,
    retryHref: payment.status !== 'successful' ? getCheckoutRetryUrl(payment.kind, payment.itemId) : undefined,
  }));
}

export function selectAccountSubscription(userId: string, userExpiry?: string, userSubscribed?: boolean): AccountSubscriptionView {
  const history = getSubscriptionHistory(userId);
  const isActive = isSubscriptionActive({ isSubscribed: userSubscribed, subscriptionExpiryDate: userExpiry });
  const activeRecord = history.find((record) => record.status === 'active');
  const payment = activeRecord?.paymentId
    ? getPaymentRecords(userId).find((record) => record.id === activeRecord.paymentId)
    : undefined;

  return {
    isActive,
    expiryDate: userExpiry,
    currentPlan: activeRecord
      ? {
          planName: activeRecord.planName,
          amount: activeRecord.amount,
          currency: activeRecord.currency,
          startedAt: formatDate(activeRecord.startedAt),
          expiresAt: formatDate(activeRecord.expiresAt),
          statusLabel: formatStatus(activeRecord.status),
          invoiceHref: payment?.status === 'successful' && payment.invoice ? payment.invoice.downloadUrl : undefined,
        }
      : undefined,
    history: history.map((record) => ({
      id: record.id,
      planName: record.planName,
      startedAt: formatDate(record.startedAt),
      expiresAt: formatDate(record.expiresAt),
      amount: record.amount,
      currency: record.currency,
      statusLabel: formatStatus(record.status),
    })),
  };
}

export function selectAccountFavorites(
  userId: string,
  isAvailable: (kind: string, itemId: string) => boolean,
  hasActiveSubscription: boolean,
): AccountFavoriteItem[] {
  const seen = new Set<string>();
  return getFavorites(userId).flatMap((favorite) => {
    const key = `${favorite.kind}:${favorite.itemId}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const catalogAvailable = isAvailable(favorite.kind, favorite.itemId);
    const blockedBySubscription = Boolean(favorite.requiresSubscription) && !hasActiveSubscription;
    return [{
      id: favorite.id,
      title: favorite.title,
      kind: favorite.kind,
      href: favorite.href,
      isAvailable: catalogAvailable && !blockedBySubscription,
      requiresSubscription: favorite.requiresSubscription,
      catalogUnavailable: !catalogAvailable,
      subscriptionExpired: blockedBySubscription,
    }];
  });
}

export function selectAccountNotifications(userId: string): AccountNotificationItem[] {
  return getNotifications(userId).map((notification) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    createdAt: notification.createdAt,
    isRead: notification.isRead,
    href: notification.href,
  }));
}

export function selectAccountNewsletter(userId: string): AccountNewsletterView {
  const latest = getLatestNewsletterSubscription(userId);
  return {
    status: latest?.status ?? 'unsubscribed',
    email: latest?.email,
  };
}

export function selectAccountUpcomingAppointments(userId: string) {
  const consultations = selectAccountConsultations(userId).filter(
    (item) => item.kind !== 'package' && item.statusLabel === formatStatus('scheduled'),
  );
  const clinicBookings = selectAccountClinicBookings(userId).filter(
    (item) => item.statusLabel === formatStatus('scheduled'),
  );
  return { consultations, clinicBookings };
}

export function selectInProgressCourse(userId: string, userQuizIds: string[] = []): AccountCourseItem | null {
  const courses = selectAccountCourses(userId, userQuizIds);
  const inProgress = courses.filter((course) => course.totalLessons > 0 && course.completedLessons < course.totalLessons);
  if (inProgress.length === 0) return null;
  return inProgress.sort((a, b) => b.completedLessons / b.totalLessons - a.completedLessons / a.totalLessons)[0];
}
