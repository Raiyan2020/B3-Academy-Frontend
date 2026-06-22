import type { BusinessContentKind, CurrencyCode } from '@/features/business/business.types';

export type PendingIntentType =
  | 'course.checkout'
  | 'course.installment'
  | 'book.checkout'
  | 'subscription.checkout'
  | 'clinic.booking'
  | 'consultation.booking'
  | 'consultation.package-session'
  | 'trip.initial-consultation'
  | 'trip.checkout'
  | 'favorite.add'
  | 'newsletter.subscribe';

interface PendingIntentCommon {
  id: string;
  schemaVersion: 2;
  type: PendingIntentType;
  createdAt: string;
  expiresAt: string;
  sourceUrl: string;
  returnUrl: string;
  href: string;
  label: string;
  itemId?: string;
  itemKind?: BusinessContentKind | 'subscription' | 'newsletter' | 'package';
  currency?: CurrencyCode;
}

export type PendingIntent = PendingIntentCommon & {
  format?: 'ebook' | 'physical' | 'bundle' | 'video' | 'text';
  paymentMode?: 'full' | 'installments';
  installmentNumber?: number;
  slotId?: string;
  slotDate?: string;
  slotTime?: string;
  timezone?: string;
  doctorId?: string;
  clinicId?: string;
  tripId?: string;
  packageId?: string;
  email?: string;
};

export type PendingIntentInput = Pick<PendingIntent, 'type' | 'href' | 'label'> &
  Partial<Omit<PendingIntent, 'id' | 'schemaVersion' | 'type' | 'createdAt' | 'expiresAt' | 'href' | 'label'>>;

export interface AccessSubject {
  isAuthenticated: boolean;
  isSubscribed?: boolean;
  user?: { isSubscribed?: boolean; subscriptionExpiryDate?: string };
  ownedCourseIds?: string[];
  ownedBookIds?: string[];
  completedConsultationIds?: string[];
}

export interface AccessRequirement {
  requiresAuth?: boolean;
  requiresSubscription?: boolean;
  requiresPurchase?: { kind: 'course' | 'book'; itemId: string };
  requiresCompletedConsultationId?: string;
  requiresActiveItem?: boolean;
  isActiveItem?: boolean;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: 'auth-required' | 'subscription-required' | 'purchase-required' | 'consultation-required' | 'inactive-item';
}
