import { apiFetch } from '@/lib/api/base-fetch';
import type { BookPurchaseFormat } from '../types/book-purchase.types';
import type {
  BookApiItem,
  BookCategoryApiItem,
  BookCheckoutTransaction,
  BookDetail,
  BookDetailApiResponse,
  BookListItem,
  CheckoutBookInput,
  MyBook,
  MyBookApiItem,
  MyBookDetailApiItem,
} from '../types/api.types';

const FALLBACK_COVER = '/images/placeholder-book.jpg';

interface Paginated<T> {
  items?: T[];
  data?: T[];
}

function toNumber(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const localized = value as Record<string, unknown>;
    return String(localized.ar || localized.en || localized.name || localized.title || fallback);
  }
  return fallback;
}

function getItems<T>(payload: T[] | Paginated<T>) {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

function mapFormat(format: BookPurchaseFormat) {
  if (format === 'physical') return 'printed';
  if (format === 'bundle') return 'both';
  return 'ebook';
}

function mapBackendCopyType(copyType?: string | null): BookPurchaseFormat {
  if (copyType === 'printed') return 'physical';
  if (copyType === 'both') return 'bundle';
  return 'ebook';
}

function mapBook(item: BookApiItem): BookListItem {
  const hasEbook = Boolean(item.has_ebook);
  const hasPrinted = Boolean(item.has_printed);
  const ownershipTypes = new Set(item.ownership?.copy_types ?? []);
  const ownsEbook = Boolean(item.ownership?.has_ebook || ownershipTypes.has('ebook') || ownershipTypes.has('both'));
  const ownsPrinted = Boolean(item.ownership?.has_printed || ownershipTypes.has('printed') || ownershipTypes.has('both'));

  return {
    id: String(item.id),
    title: text(item.name, 'Book'),
    author: text(item.author, ''),
    description: text(item.description || item.short_description, ''),
    coverImage: item.cover_image || FALLBACK_COVER,
    category: text(item.book_category?.name, ''),
    prices: {
      ebook: toNumber(item.ebook_price),
      physical: toNumber(item.printed_price),
      bundle: toNumber(item.both_price),
    },
    availability: {
      ebook: hasEbook,
      physical: hasPrinted,
      bundle: hasEbook && hasPrinted && toNumber(item.both_price) > 0,
    },
    isFeatured: Boolean(item.is_featured),
    ownership: {
      ebook: ownsEbook,
      physical: ownsPrinted,
      bundle: ownsEbook && ownsPrinted,
    },
  };
}

function mapMyBook(item: MyBookApiItem): MyBook {
  return {
    id: String(item.id),
    bookId: String(item.book_id),
    title: item.name,
    format: mapBackendCopyType(item.copy_type),
    formatLabel: item.copy_type_label || item.copy_type || '',
    paidAmount: item.paid_amount?.amount ?? 0,
    currency: item.paid_amount?.currency || 'KWD',
    readUrl: item.read_url,
    readUrlExpiresAt: item.read_url_expires_at,
    paidAt: item.paid_at,
  };
}

export async function getBookCategories() {
  const response = await apiFetch<BookCategoryApiItem[]>('/api/user/books/categories');
  return response.map((item) => ({ id: String(item.id), name: text(item.name, 'Category') }));
}

export async function getApiBooks(query?: { search?: string; page?: number; perPage?: number }) {
  const response = await apiFetch<BookApiItem[] | Paginated<BookApiItem>>('/api/user/books', {
    query: { search: query?.search, page: query?.page, per_page: query?.perPage ?? 50 },
  });
  return getItems(response).map(mapBook);
}

export async function getApiFeaturedBooks(limit = 4) {
  const response = await apiFetch<BookApiItem[] | Paginated<BookApiItem>>('/api/user/books/featured', {
    query: { per_page: limit },
  });
  return getItems(response).map(mapBook).slice(0, limit);
}

export async function getApiBookDetail(id: string): Promise<BookDetail> {
  const response = await apiFetch<BookDetailApiResponse>(`/api/user/books/${id}`);
  return {
    ...mapBook(response.book),
    similarBooks: (response.similar_books || []).map(mapBook),
  };
}

export async function checkoutBook(input: CheckoutBookInput) {
  return apiFetch<BookCheckoutTransaction>(`/api/user/books/${input.bookId}/checkout`, {
    method: 'POST',
    body: {
      order_type: mapFormat(input.format),
      payment_method_id: Number(input.paymentMethodId),
      currency: input.currency,
      idempotency_key: input.idempotencyKey,
      user_address_id: input.userAddressId ? Number(input.userAddressId) : undefined,
    },
  });
}

export async function getMyBooks() {
  const response = await apiFetch<MyBookApiItem[] | Paginated<MyBookApiItem>>('/api/user/my-books', {
    query: { per_page: 50 },
  });
  return getItems(response).map(mapMyBook);
}

export async function getMyBook(orderId: string) {
  const response = await apiFetch<MyBookDetailApiItem>(`/api/user/my-books/${orderId}`);
  return mapMyBook(response);
}

export function getMyBookInvoiceUrl(orderId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://portal.b3.raiyan.cc/';
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}/api/user/my-books/${orderId}/invoice`;
}

export function getBookStreamUrl(bookId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://portal.b3.raiyan.cc/';
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}/api/v1/user/books/${bookId}/stream-ebook`;
}
