'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { PendingIntent } from '../types/access.types';

const PENDING_INTENT_KEY = 'b3-pending-intent';

export function savePendingIntent(input: Omit<PendingIntent, 'id' | 'createdAt'>) {
  const intent: PendingIntent = {
    ...input,
    id: `intent-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  writeLocalStorageJson(PENDING_INTENT_KEY, intent);
  return intent;
}

export function readPendingIntent() {
  return readLocalStorageJson<PendingIntent | null>(PENDING_INTENT_KEY, null);
}

export function clearPendingIntent() {
  writeLocalStorageJson(PENDING_INTENT_KEY, null);
}
