'use client';

import { getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from '@/lib/storage/safe-local-storage';
import { createStableId } from '@/features/business/repository';
import type { PendingIntent, PendingIntentInput, PendingIntentType } from '../types/access.types';

const PENDING_INTENT_KEY = 'b3-pending-intent';
export const PENDING_INTENT_TTL_MS = 30 * 60 * 1000;
const TYPES = new Set<PendingIntentType>([
  'course.checkout', 'course.installment', 'book.checkout', 'subscription.checkout', 'clinic.booking',
  'consultation.booking', 'consultation.package-session', 'trip.initial-consultation', 'trip.checkout',
  'favorite.add', 'newsletter.subscribe',
]);

export function isExpired(intent: Pick<PendingIntent, 'expiresAt'>, now = Date.now()) {
  return !Number.isFinite(Date.parse(intent.expiresAt)) || Date.parse(intent.expiresAt) <= now;
}

function isPendingIntent(value: unknown): value is PendingIntent {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PendingIntent>;
  return item.schemaVersion === 2 && typeof item.id === 'string' && typeof item.type === 'string' &&
    TYPES.has(item.type as PendingIntentType) && typeof item.href === 'string' && item.href.startsWith('/') &&
    typeof item.sourceUrl === 'string' && typeof item.returnUrl === 'string' && typeof item.createdAt === 'string' &&
    typeof item.expiresAt === 'string';
}

export function savePendingIntent(input: PendingIntentInput, now = Date.now()) {
  const sourceUrl = input.sourceUrl || (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/');
  const intent: PendingIntent = {
    ...input,
    id: createStableId('intent'),
    schemaVersion: 2,
    sourceUrl,
    returnUrl: input.returnUrl || sourceUrl,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + PENDING_INTENT_TTL_MS).toISOString(),
  };
  setLocalStorageItem(PENDING_INTENT_KEY, JSON.stringify(intent));
  return intent;
}

export function readPendingIntent(now = Date.now()): PendingIntent | null {
  const raw = getLocalStorageItem(PENDING_INTENT_KEY);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isPendingIntent(value) || isExpired(value, now)) {
      clearPendingIntent();
      return null;
    }
    return value;
  } catch {
    clearPendingIntent();
    return null;
  }
}

export function consumePendingIntent(expectedId?: string, now = Date.now()) {
  const intent = readPendingIntent(now);
  if (!intent || (expectedId && intent.id !== expectedId)) return null;
  clearPendingIntent();
  return intent;
}

export function clearPendingIntent() {
  removeLocalStorageItem(PENDING_INTENT_KEY);
}
