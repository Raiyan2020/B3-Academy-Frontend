import type { CurrencyCode } from '@/features/business/business.types';

export type PaymentKind =
  | 'course-full'
  | 'course-installment'
  | 'book-ebook'
  | 'book-print'
  | 'book-bundle'
  | 'clinic-appointment'
  | 'consultation-session'
  | 'consultation-package'
  | 'trip-package'
  | 'subscription-plan';

export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'cancelled' | 'blocked-unavailable';

export type PaymentFailureReason =
  | 'gateway-declined'
  | 'user-cancelled'
  | 'item-unavailable'
  | 'slot-unavailable'
  | 'duplicate-purchase'
  | 'validation-error';

export type InvoiceStatus = 'not-issued' | 'issued' | 'void';

export type PaymentIntentStatus = 'review' | 'processing' | PaymentStatus;

export interface InvoiceRecord {
  id: string;
  paymentId: string;
  issuedAt: string;
  downloadUrl: string;
  status: InvoiceStatus;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  kind: PaymentKind;
  itemId: string;
  itemName: string;
  amount: number;
  currency: CurrencyCode;
  method: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
  gatewayReference?: string;
  failureReason?: PaymentFailureReason;
  receiptEmailSentAt?: string;
  relatedBookingId?: string;
  invoice?: InvoiceRecord;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  kind: PaymentKind;
  itemId: string;
  itemName: string;
  amount: number;
  currency: CurrencyCode;
  method: string;
  status: PaymentIntentStatus;
  createdAt: string;
  updatedAt?: string;
  failureReason?: PaymentFailureReason;
  relatedBookingId?: string;
  paymentMode?: 'full' | 'installments';
  installmentNumber?: number;
}
