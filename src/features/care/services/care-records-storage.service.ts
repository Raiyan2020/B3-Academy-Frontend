'use client';

import { addNotification } from '@/features/account/services/account-records.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { StoredClinicBookingRecord, StoredConsultationRecord, StoredTripPurchaseRecord } from '../types/care.types';

const CONSULTATIONS_KEY = 'b3-care-consultation-records';
const TRIPS_KEY = 'b3-care-trip-records';
const CLINIC_BOOKINGS_KEY = 'b3-care-clinic-booking-records';

export function getStoredConsultations(userId?: string) {
  const all = readLocalStorageJson<StoredConsultationRecord[]>(CONSULTATIONS_KEY, []);
  return userId ? all.filter((record) => record.userId === userId) : all;
}

export function addStoredConsultation(record: Omit<StoredConsultationRecord, 'id' | 'createdAt'>) {
  const next: StoredConsultationRecord = {
    ...record,
    id: `consult-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  writeLocalStorageJson(CONSULTATIONS_KEY, [next, ...getStoredConsultations()]);
  addNotification({
    userId: next.userId,
    title: 'تم تسجيل الاستشارة',
    body: `تمت إضافة ${next.serviceName.ar} إلى حسابك.`,
    href: '/dashboard/consultations',
  });
  return next;
}

export function getStoredTripPurchases(userId?: string) {
  const all = readLocalStorageJson<StoredTripPurchaseRecord[]>(TRIPS_KEY, []);
  return userId ? all.filter((record) => record.userId === userId) : all;
}

export function hasStoredTripPurchase(userId: string, tripId: string) {
  return getStoredTripPurchases(userId).some((record) => record.tripId === tripId && record.status !== 'cancelled');
}

export function addStoredTripPurchase(record: Omit<StoredTripPurchaseRecord, 'id' | 'purchasedAt'>) {
  const next: StoredTripPurchaseRecord = {
    ...record,
    id: `trip-purchase-${Date.now()}`,
    purchasedAt: new Date().toISOString(),
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
  const all = readLocalStorageJson<StoredClinicBookingRecord[]>(CLINIC_BOOKINGS_KEY, []);
  return userId ? all.filter((record) => record.userId === userId) : all;
}

export function addStoredClinicBooking(record: Omit<StoredClinicBookingRecord, 'id' | 'createdAt'>) {
  const next: StoredClinicBookingRecord = {
    ...record,
    id: `clinic-book-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  writeLocalStorageJson(CLINIC_BOOKINGS_KEY, [next, ...getStoredClinicBookings()]);
  addNotification({
    userId: next.userId,
    title: 'تم تأكيد حجز العيادة',
    body: `تم تأكيد موعد ${next.serviceName.ar} مع ${next.doctorName.ar}.`,
    href: '/dashboard/clinic-bookings',
  });
  return next;
}
