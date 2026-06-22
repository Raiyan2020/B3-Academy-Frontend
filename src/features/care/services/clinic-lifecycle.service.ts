'use client';

import type { BookingStatus } from '@/features/business/status.types';
import type { StoredClinicBookingRecord } from '../types/care.types';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

const CLINIC_BOOKINGS_KEY = 'b3-care-clinic-booking-records';

function readRawClinicBookings() {
  return readLocalStorageJson<StoredClinicBookingRecord[]>(CLINIC_BOOKINGS_KEY, []);
}

function patchClinicBooking(id: string, patch: Partial<StoredClinicBookingRecord>) {
  const next = readRawClinicBookings().map((record) =>
    record.id === id ? { ...record, ...patch, id: record.id } : record,
  );
  writeLocalStorageJson(CLINIC_BOOKINGS_KEY, next);
}

function parseBookingStart(record: Pick<StoredClinicBookingRecord, 'date' | 'time'>): Date | null {
  if (!record.date || !record.time) return null;
  const parsed = new Date(`${record.date}T${record.time}`);
  return Number.isNaN(parsed.getTime()) ? new Date(`${record.date} ${record.time}`) : parsed;
}

export function getClinicBookingEndTime(record: StoredClinicBookingRecord): Date | null {
  const start = parseBookingStart(record);
  if (!start) return null;
  const durationMinutes = record.duration ?? 45;
  return new Date(start.getTime() + durationMinutes * 60_000);
}

export function deriveClinicBookingStatus(
  record: StoredClinicBookingRecord,
  now: Date = new Date(),
): StoredClinicBookingRecord['status'] {
  if (record.status === 'cancelled') return 'cancelled';
  if (record.status === 'completed') return 'completed';

  const end = getClinicBookingEndTime(record);
  if (!end || now.getTime() < end.getTime()) {
    return record.status;
  }

  return 'completed';
}

export function deriveClinicBookingBookingStatus(
  record: StoredClinicBookingRecord,
  now: Date = new Date(),
): BookingStatus | undefined {
  if (record.bookingStatus === 'cancelled' || record.status === 'cancelled') return 'cancelled';
  if (record.bookingStatus === 'completed' || record.status === 'completed') return 'completed';

  const end = getClinicBookingEndTime(record);
  if (!end || now.getTime() < end.getTime()) {
    return record.bookingStatus;
  }

  return 'completed';
}

export function withDerivedClinicBookingStatus(
  record: StoredClinicBookingRecord,
  now: Date = new Date(),
): StoredClinicBookingRecord {
  const status = deriveClinicBookingStatus(record, now);
  const bookingStatus = deriveClinicBookingBookingStatus(record, now);
  return {
    ...record,
    status,
    bookingStatus: bookingStatus ?? record.bookingStatus,
  };
}

export function syncClinicBookingLifecycle(now: Date = new Date()) {
  readRawClinicBookings().forEach((record) => {
    const derived = withDerivedClinicBookingStatus(record, now);
    if (derived.status !== record.status || derived.bookingStatus !== record.bookingStatus) {
      patchClinicBooking(record.id, {
        status: derived.status,
        bookingStatus: derived.bookingStatus,
      });
    }
  });
}
