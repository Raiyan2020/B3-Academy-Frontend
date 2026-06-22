import type { BookingStatus } from '@/features/business/status.types';
import type { StoredConsultationRecord } from '../types/care.types';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

const CONSULTATIONS_KEY = 'b3-care-consultation-records';

function readRawConsultations() {
  return readLocalStorageJson<StoredConsultationRecord[]>(CONSULTATIONS_KEY, []);
}

function patchConsultation(id: string, patch: Partial<StoredConsultationRecord>) {
  const next = readRawConsultations().map((record) =>
    record.id === id ? { ...record, ...patch, id: record.id } : record,
  );
  writeLocalStorageJson(CONSULTATIONS_KEY, next);
  return next.find((record) => record.id === id) ?? null;
}

function parseConsultationStart(record: Pick<StoredConsultationRecord, 'date' | 'time'>): Date | null {
  if (!record.date || record.time === '-') return null;
  const parsed = new Date(`${record.date}T${record.time}`);
  return Number.isNaN(parsed.getTime()) ? new Date(`${record.date} ${record.time}`) : parsed;
}

export function getConsultationEndTime(record: StoredConsultationRecord): Date | null {
  const start = parseConsultationStart(record);
  if (!start) return null;
  const durationMinutes = record.duration ?? 60;
  return new Date(start.getTime() + durationMinutes * 60_000);
}

export function deriveConsultationStatus(
  record: StoredConsultationRecord,
  now: Date = new Date(),
): StoredConsultationRecord['status'] {
  if (record.status === 'cancelled') return 'cancelled';
  if (record.status === 'completed') return 'completed';
  if (record.kind === 'package' && record.status === 'purchased') return 'purchased';

  const end = getConsultationEndTime(record);
  if (!end || now.getTime() < end.getTime()) {
    return record.status;
  }

  if (record.portalEnteredAt || record.bookingStatus === 'completed') {
    return 'completed';
  }

  return 'missed';
}

export function deriveBookingStatus(
  record: StoredConsultationRecord,
  now: Date = new Date(),
): BookingStatus | undefined {
  if (record.bookingStatus === 'cancelled' || record.status === 'cancelled') return 'cancelled';
  if (record.bookingStatus === 'completed' || record.status === 'completed') return 'completed';
  if (record.bookingStatus === 'missed') return 'missed';

  const end = getConsultationEndTime(record);
  if (!end || now.getTime() < end.getTime()) {
    return record.bookingStatus;
  }

  if (record.portalEnteredAt) return 'completed';
  return 'missed';
}

export function withDerivedConsultationStatus(
  record: StoredConsultationRecord,
  now: Date = new Date(),
): StoredConsultationRecord {
  const status = deriveConsultationStatus(record, now);
  const bookingStatus = deriveBookingStatus(record, now);
  return {
    ...record,
    status,
    bookingStatus: bookingStatus ?? record.bookingStatus,
  };
}

export function syncConsultationLifecycle(now: Date = new Date()) {
  readRawConsultations().forEach((record) => {
    const derived = withDerivedConsultationStatus(record, now);
    if (derived.status !== record.status || derived.bookingStatus !== record.bookingStatus) {
      patchConsultation(record.id, {
        status: derived.status,
        bookingStatus: derived.bookingStatus,
      });
    }
  });
}

export function markConsultationPortalEntered(id: string) {
  return patchConsultation(id, {
    portalEnteredAt: new Date().toISOString(),
    bookingStatus: 'active',
  });
}

export function markConsultationCompleted(id: string) {
  return patchConsultation(id, {
    status: 'completed',
    bookingStatus: 'completed',
    portalEnteredAt: new Date().toISOString(),
  });
}
