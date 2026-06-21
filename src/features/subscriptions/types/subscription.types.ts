import type { CurrencyCode } from '@/features/business/business.types';

export interface SubscriptionHistoryRecord {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: CurrencyCode;
  startedAt: string;
  expiresAt: string;
  renewal: 'manual';
  paymentId?: string;
  status: 'active' | 'expired';
}
