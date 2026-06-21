import type { BusinessContentKind } from '@/features/business/business.types';

export type PendingIntentType =
  | 'course.checkout'
  | 'book.checkout'
  | 'subscription.checkout'
  | 'clinic.booking'
  | 'consultation.booking'
  | 'trip.checkout'
  | 'favorite.add';

export interface PendingIntent {
  id: string;
  type: PendingIntentType;
  href: string;
  label: string;
  itemId?: string;
  itemKind?: BusinessContentKind | 'subscription';
  createdAt: string;
}

export interface AccessSubject {
  isAuthenticated: boolean;
  isSubscribed?: boolean;
  ownedCourseIds?: string[];
  ownedBookIds?: string[];
  completedConsultationIds?: string[];
}

export interface AccessRequirement {
  requiresAuth?: boolean;
  requiresSubscription?: boolean;
  requiresPurchase?: {
    kind: 'course' | 'book';
    itemId: string;
  };
  requiresCompletedConsultationId?: string;
  requiresActiveItem?: boolean;
  isActiveItem?: boolean;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: 'auth-required' | 'subscription-required' | 'purchase-required' | 'consultation-required' | 'inactive-item';
}
