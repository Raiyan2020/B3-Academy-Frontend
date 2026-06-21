'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { SubscriptionHistoryRecord } from '../types/subscription.types';

const SUBSCRIPTION_HISTORY_KEY = 'b3-subscription-history';

export function getSubscriptionHistory(userId?: string) {
  const all = readLocalStorageJson<SubscriptionHistoryRecord[]>(SUBSCRIPTION_HISTORY_KEY, []);
  const now = Date.now();
  const normalized = all.map((record) => ({
    ...record,
    status: new Date(record.expiresAt).getTime() > now ? 'active' : 'expired',
  })) as SubscriptionHistoryRecord[];
  return userId ? normalized.filter((record) => record.userId === userId) : normalized;
}

export function addSubscriptionHistory(record: Omit<SubscriptionHistoryRecord, 'id' | 'status'>) {
  const next: SubscriptionHistoryRecord = {
    ...record,
    id: `sub-history-${Date.now()}`,
    status: new Date(record.expiresAt).getTime() > Date.now() ? 'active' : 'expired',
  };
  writeLocalStorageJson(SUBSCRIPTION_HISTORY_KEY, [next, ...getSubscriptionHistory()]);
  return next;
}
