import type { CurrencyCode } from '@/features/business/business.types';

export type BookPurchaseFormat = 'ebook' | 'physical' | 'bundle';
export type BookPurchaseStatus = 'purchased' | 'shipped' | 'delivered' | 'cancelled';

export interface BookPurchase {
  id: string;
  userId: string;
  bookId: string;
  format: BookPurchaseFormat;
  price: number;
  currency?: CurrencyCode;
  shippingAddressId?: string;
  shippingAddressLabel?: string;
  printOrderId?: string;
  status: BookPurchaseStatus;
  purchasedAt: string;
  paymentId?: string;
}

export interface PrintOrderRecord {
  id: string;
  userId: string;
  bookId: string;
  purchaseId: string;
  bookTitle: { en: string; ar: string };
  format: 'physical' | 'bundle';
  shippingAddressId: string;
  shippingAddressLabel: string;
  status: 'pending_fulfillment' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  adminNotifyPending: boolean;
}
