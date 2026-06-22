'use client';

import { addNotification } from '@/features/account/services/account-records.service';
import { createStableId } from '@/features/business/repository';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import {
  syncConsultationLifecycle,
  withDerivedConsultationStatus,
} from './consultation-lifecycle.service';
import { syncClinicBookingLifecycle, withDerivedClinicBookingStatus } from './clinic-lifecycle.service';
import type {
  StoredClinicBookingRecord,
  StoredConsultationRecord,
  StoredPackageSessionRecord,
  StoredTripPurchaseRecord,
} from '../types/care.types';

const CONSULTATIONS_KEY = 'b3-care-consultation-records';
const TRIPS_KEY = 'b3-care-trip-records';
const CLINIC_BOOKINGS_KEY = 'b3-care-clinic-booking-records';
const PACKAGE_SESSIONS_KEY = 'b3-care-package-session-records';

function readRawConsultations() {
  return readLocalStorageJson<StoredConsultationRecord[]>(CONSULTATIONS_KEY, []);
}

function readRawClinicBookings() {
  return readLocalStorageJson<StoredClinicBookingRecord[]>(CLINIC_BOOKINGS_KEY, []);
}

export function getStoredConsultations(userId?: string) {
  syncConsultationLifecycle();
  const all = readRawConsultations().map((record) => withDerivedConsultationStatus(record));
  return userId ? all.filter((record) => record.userId === userId) : all;
}

export function getStoredConsultationById(id: string) {
  syncConsultationLifecycle();
  const record = readRawConsultations().find((candidate) => candidate.id === id);
  return record ? withDerivedConsultationStatus(record) : null;
}

function writeConsultations(records: StoredConsultationRecord[]) {
  writeLocalStorageJson(CONSULTATIONS_KEY, records);
}

export function updateStoredConsultation(id: string, patch: Partial<StoredConsultationRecord>) {
  let updated: StoredConsultationRecord | null = null;
  const next = readRawConsultations().map((record) => {
    if (record.id !== id) return record;
    updated = { ...record, ...patch, id: record.id };
    return updated;
  });
  writeConsultations(next);
  return updated;
}

export function addStoredConsultation(record: Omit<StoredConsultationRecord, 'id' | 'createdAt'>) {
  const next: StoredConsultationRecord = {
    ...record,
    id: createStableId('consult'),
    createdAt: new Date().toISOString(),
  };
  writeConsultations([next, ...readRawConsultations()]);
  addNotification({
    userId: next.userId,
    title: 'تم تسجيل الاستشارة',
    body: `تمت إضافة ${next.serviceName.ar} إلى حسابك.`,
    href: `/consultation/${next.id}`,
  });
  return next;
}

export function getStoredTripPurchases(userId?: string) {
  const all = readLocalStorageJson<StoredTripPurchaseRecord[]>(TRIPS_KEY, []);
  return userId ? all.filter((record) => record.userId === userId) : all;
}

export function getStoredTripPurchaseById(id: string) {
  return getStoredTripPurchases().find((record) => record.id === id) ?? null;
}

export function hasStoredTripPurchase(userId: string, tripId: string) {
  return getStoredTripPurchases(userId).some((record) => record.tripId === tripId && record.status !== 'cancelled');
}

export function addStoredTripPurchase(record: Omit<StoredTripPurchaseRecord, 'id' | 'purchasedAt'>) {
  const next: StoredTripPurchaseRecord = {
    ...record,
    id: createStableId('trip-purchase'),
    purchasedAt: new Date().toISOString(),
    adminNotifyPending: record.adminNotifyPending ?? true,
  };
  writeLocalStorageJson(TRIPS_KEY, [next, ...getStoredTripPurchases()]);
  addNotification({
    userId: next.userId,
    title: 'تم شراء باقة الرحلة',
    body: `تمت إضافة ${next.title.ar} إلى حسابك، وستتواصل الإدارة معك للتنسيق.`,
    href: '/dashboard/trips',
  });
  return next;
}

export function getStoredClinicBookings(userId?: string) {
  syncClinicBookingLifecycle();
  const all = readRawClinicBookings().map((record) => withDerivedClinicBookingStatus(record));
  return userId ? all.filter((record) => record.userId === userId) : all;
}

export function getStoredClinicBookingById(id: string) {
  syncClinicBookingLifecycle();
  const record = readRawClinicBookings().find((candidate) => candidate.id === id);
  return record ? withDerivedClinicBookingStatus(record) : null;
}

export function updateStoredClinicBooking(id: string, patch: Partial<StoredClinicBookingRecord>) {
  let updated: StoredClinicBookingRecord | null = null;
  const next = readRawClinicBookings().map((record) => {
    if (record.id !== id) return record;
    updated = { ...record, ...patch, id: record.id };
    return updated;
  });
  writeLocalStorageJson(CLINIC_BOOKINGS_KEY, next);
  return updated;
}

export function addStoredClinicBooking(record: Omit<StoredClinicBookingRecord, 'id' | 'createdAt'>) {
  const next: StoredClinicBookingRecord = {
    ...record,
    id: createStableId('clinic-book'),
    createdAt: new Date().toISOString(),
  };
  writeLocalStorageJson(CLINIC_BOOKINGS_KEY, [next, ...readRawClinicBookings()]);
  addNotification({
    userId: next.userId,
    title: 'تم تأكيد حجز العيادة',
    body: `تم تأكيد موعد ${next.serviceName.ar} مع ${next.doctorName.ar}.`,
    href: '/dashboard/clinic-bookings',
  });
  return next;
}

export function getStoredPackageSessions(userId?: string) {
  const all = readLocalStorageJson<StoredPackageSessionRecord[]>(PACKAGE_SESSIONS_KEY, []);
  return userId ? all.filter((record) => record.userId === userId) : all;
}

export function getStoredPackageSessionById(id: string) {
  return getStoredPackageSessions().find((record) => record.id === id) ?? null;
}

export function addStoredPackageSession(record: Omit<StoredPackageSessionRecord, 'id' | 'createdAt'>) {
  const next: StoredPackageSessionRecord = {
    ...record,
    id: createStableId('package-session'),
    createdAt: new Date().toISOString(),
  };
  writeLocalStorageJson(PACKAGE_SESSIONS_KEY, [next, ...getStoredPackageSessions()]);
  addNotification({
    userId: next.userId,
    title: 'تم حجز جلسة الباقة',
    body: 'تمت إضافة جلسة الباقة إلى حسابك.',
    href: `/consultation/${record.consultationId}`,
  });
  return next;
}

export function schedulePackageSession(input: {
  userId: string;
  packageConsultationId: string;
  doctorId: string;
  doctorName: StoredConsultationRecord['doctorName'];
  serviceName: StoredConsultationRecord['serviceName'];
  packageId: string;
  slotId: string;
  date: string;
  time: string;
  timezone: string;
  duration: number;
  sessionFormat?: 'video' | 'text';
}) {
  const packageRecord = getStoredConsultationById(input.packageConsultationId);
  if (!packageRecord || packageRecord.kind !== 'package' || packageRecord.userId !== input.userId) {
    return { ok: false as const, code: 'not_found' };
  }
  const remaining = packageRecord.remainingSessions ?? 0;
  if (remaining <= 0) {
    return { ok: false as const, code: 'no_allowance' };
  }

  const sessionFormat = input.sessionFormat ?? 'text';
  const sessionConsultation = addStoredConsultation({
    userId: input.userId,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    serviceName: input.serviceName,
    kind: sessionFormat === 'video' ? 'individual-video' : 'individual-text',
    serviceKind: 'package_session',
    date: input.date,
    time: input.time,
    slotId: input.slotId,
    timezone: input.timezone,
    duration: input.duration,
    price: 0,
    status: 'scheduled',
    bookingStatus: 'confirmed',
    packageId: input.packageId,
    portalHref: undefined,
  });

  const withPortal = updateStoredConsultation(sessionConsultation.id, {
    portalHref: sessionFormat === 'text' ? `/consultation/${sessionConsultation.id}/chat` : `/consultation/${sessionConsultation.id}`,
  })!;

  addStoredPackageSession({
    userId: input.userId,
    packageId: input.packageId,
    consultationId: withPortal.id,
    doctorId: input.doctorId,
    slotId: input.slotId,
    date: input.date,
    time: input.time,
    timezone: input.timezone,
    duration: input.duration,
    status: 'confirmed',
    sessionFormat,
  });

  updateStoredConsultation(input.packageConsultationId, {
    remainingSessions: remaining - 1,
  });

  return { ok: true as const, value: withPortal };
}

export interface PackageSessionBookingInput {
  slotId: string;
  date: string;
  time: string;
  timezone: string;
  duration: number;
  format: 'video' | 'text';
}

export function purchasePackageWithSessions(input: {
  userId: string;
  packageId: string;
  doctorId: string;
  doctorName: StoredConsultationRecord['doctorName'];
  serviceName: StoredConsultationRecord['serviceName'];
  sessionCount: number;
  price: number;
  paymentId: string;
  sessions: PackageSessionBookingInput[];
}) {
  const packageRecord = addStoredConsultation({
    userId: input.userId,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    serviceName: input.serviceName,
    kind: 'package',
    date: input.sessions[0]?.date ?? new Date().toISOString().slice(0, 10),
    time: input.sessions[0]?.time ?? '-',
    price: input.price,
    status: 'purchased',
    paymentId: input.paymentId,
    packageId: input.packageId,
    sessionCount: input.sessionCount,
    remainingSessions: 0,
  });

  input.sessions.forEach((session, index) => {
    const sessionConsultation = addStoredConsultation({
      userId: input.userId,
      doctorId: input.doctorId,
      doctorName: input.doctorName,
      serviceName: {
        ar: `${input.serviceName.ar} - جلسة ${index + 1}`,
        en: `${input.serviceName.en} - Session ${index + 1}`,
      },
      kind: session.format === 'video' ? 'individual-video' : 'individual-text',
      serviceKind: 'package_session',
      date: session.date,
      time: session.time,
      slotId: session.slotId,
      timezone: session.timezone,
      duration: session.duration,
      price: 0,
      status: 'scheduled',
      bookingStatus: 'confirmed',
      packageId: input.packageId,
      portalHref: session.format === 'text' ? undefined : undefined,
    });

    updateStoredConsultation(sessionConsultation.id, {
      portalHref: session.format === 'text'
        ? `/consultation/${sessionConsultation.id}/chat`
        : `/consultation/${sessionConsultation.id}`,
    });

    addStoredPackageSession({
      userId: input.userId,
      packageId: input.packageId,
      consultationId: sessionConsultation.id,
      doctorId: input.doctorId,
      slotId: session.slotId,
      date: session.date,
      time: session.time,
      timezone: session.timezone,
      duration: session.duration,
      status: 'confirmed',
      sessionFormat: session.format,
    });
  });

  return packageRecord;
}
