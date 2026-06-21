export type BookPurchaseFormat = 'ebook' | 'physical' | 'bundle';
export type BookPurchaseStatus = 'purchased' | 'shipped' | 'delivered' | 'cancelled';

export interface BookPurchase {
  id: string;
  userId: string;
  bookId: string;
  format: BookPurchaseFormat;
  price: number;
  shippingAddress?: string;
  status: BookPurchaseStatus;
  purchasedAt: string;
  paymentId?: string;
}
