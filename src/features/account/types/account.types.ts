import type { BusinessContentKind } from '@/features/business/business.types';

export interface FavoriteItem {
  id: string;
  userId: string;
  itemId: string;
  kind: BusinessContentKind;
  title: string;
  href: string;
  isAvailable: boolean;
  requiresSubscription?: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
}

export interface HealthAssessmentRecord {
  id: string;
  userId: string;
  submittedAt: string;
  summary: string;
  answers?: Record<string, number>;
  additionalNotes?: string;
  adminNotified?: boolean;
}

