import type { StoredConsultationRecord } from '../types/care.types';

export type PortalState = 'not_yet_open' | 'prep_only' | 'open' | 'closed' | 'unavailable';

const PREP_WINDOW_MINUTES = 30;

function parseConsultationStart(record: Pick<StoredConsultationRecord, 'date' | 'time'>): Date | null {
  if (!record.date || record.time === '-') return null;
  const parsed = new Date(`${record.date}T${record.time}`);
  return Number.isNaN(parsed.getTime()) ? new Date(`${record.date} ${record.time}`) : parsed;
}

export function getConsultationEndTime(record: StoredConsultationRecord, now: Date = new Date()): Date | null {
  const start = parseConsultationStart(record);
  if (!start) return null;
  const durationMinutes = record.duration ?? 60;
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  if (record.portalEnteredAt && now.getTime() > start.getTime()) {
    const enteredAt = new Date(record.portalEnteredAt).getTime();
    if (!Number.isNaN(enteredAt) && enteredAt > start.getTime()) {
      const remainingMs = end.getTime() - enteredAt;
      return new Date(enteredAt + remainingMs);
    }
  }

  return end;
}

export function getPortalState(record: StoredConsultationRecord, now: Date = new Date()): PortalState {
  if (record.status === 'cancelled' || record.bookingStatus === 'cancelled' || record.bookingStatus === 'closed') {
    return 'closed';
  }
  if (record.status === 'completed' || record.bookingStatus === 'completed' || record.bookingStatus === 'missed') {
    return 'closed';
  }
  if (record.kind === 'package' && record.status === 'purchased') {
    return 'unavailable';
  }

  const start = parseConsultationStart(record);
  if (!start) return 'unavailable';

  const nowMs = now.getTime();
  const prepStart = start.getTime() - PREP_WINDOW_MINUTES * 60_000;
  const end = getConsultationEndTime(record, now);

  if (!end) return 'unavailable';
  if (nowMs < prepStart) return 'not_yet_open';
  if (nowMs < start.getTime()) return 'prep_only';
  if (nowMs > end.getTime()) return 'closed';
  return 'open';
}

export function isPortalReadOnly(record: StoredConsultationRecord, now: Date = new Date()): boolean {
  const state = getPortalState(record, now);
  return state === 'closed' || state === 'prep_only' || state === 'not_yet_open';
}

export function canInteractInPortal(record: StoredConsultationRecord, now: Date = new Date()) {
  return getPortalState(record, now) === 'open';
}

export function canAccessTextPortal(record: StoredConsultationRecord, now: Date = new Date()): boolean {
  const state = getPortalState(record, now);
  return record.kind === 'individual-text' && (state === 'open' || state === 'prep_only');
}

export function canAccessVideoPortal(record: StoredConsultationRecord, now: Date = new Date()): boolean {
  const state = getPortalState(record, now);
  return record.kind === 'individual-video' && (state === 'open' || state === 'prep_only');
}

export function getRemainingPortalMinutes(record: StoredConsultationRecord, now: Date = new Date()) {
  const end = getConsultationEndTime(record, now);
  if (!end) return 0;
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 60_000));
}
