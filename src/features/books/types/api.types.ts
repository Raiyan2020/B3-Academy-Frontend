import type { PaymentTransaction } from '@/features/subscriptions/types/api.types';
import type { BookPurchaseFormat } from './book-purchase.types';

export interface BookCategoryApiItem {
  id: number | string;
  name: BackendText;
}

export type BackendText = string | Record<string, unknown>;

export interface BookOwnershipApi {
  has_ebook?: boolean;
  has_printed?: boolean;
  copy_types?: string[];
}

export interface BookApiItem {
  id: number | string;
  name: BackendText;
  author?: BackendText | null;
  short_description?: BackendText | null;
  description?: BackendText | null;
  cover_image?: string | null;
  book_category?: BookCategoryApiItem | null;
  has_ebook?: boolean;
  has_printed?: boolean;
  ebook_price?: number | string | null;
  printed_price?: number | string | null;
  both_price?: number | string | null;
  is_featured?: boolean;
  ownership?: BookOwnershipApi | null;
}

export interface BookDetailApiResponse {
  book: BookApiItem;
  similar_books?: BookApiItem[];
}

export interface BookListItem {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  category: string;
  prices: Record<BookPurchaseFormat, number>;
  availability: Record<BookPurchaseFormat, boolean>;
  isFeatured: boolean;
  ownership: Record<BookPurchaseFormat, boolean>;
}

export interface BookDetail extends BookListItem {
  similarBooks: BookListItem[];
}

export interface MoneyApi {
  amount: number;
  currency: string;
}

export interface MyBookApiItem {
  id: number | string;
  book_id: number | string;
  name: string;
  copy_type?: string | null;
  copy_type_label?: string | null;
  paid_amount?: MoneyApi | null;
  read_url?: string | null;
  read_url_expires_at?: string | null;
  paid_at?: string | null;
}

export interface MyBookDetailApiItem extends MyBookApiItem {
  shipping_address?: unknown;
  payment_method?: { id?: number | string; name?: string | null } | null;
  invoice?: { url?: string | null; download_url?: string | null; id?: number | string } | null;
}

export interface MyBook {
  id: string;
  bookId: string;
  title: string;
  format: BookPurchaseFormat;
  formatLabel: string;
  paidAmount: number;
  currency: string;
  readUrl?: string | null;
  readUrlExpiresAt?: string | null;
  paidAt?: string | null;
}

export interface CheckoutBookInput {
  bookId: string;
  format: BookPurchaseFormat;
  paymentMethodId: string;
  currency: string;
  idempotencyKey: string;
  userAddressId?: string;
}

export type BookCheckoutTransaction = PaymentTransaction;
