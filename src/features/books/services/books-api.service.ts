import { apiFetch, resolveApiUrl } from '@/lib/api/base-fetch';
import type { BookPurchaseFormat } from '../types/book-purchase.types';
import { LOGO_IMAGE } from '@/lib/images';
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

const FALLBACK_COVER = LOGO_IMAGE;

/** Backend base currency (config/currency.php) — the default when the customer picks nothing. */
export const BOOK_BASE_CURRENCY = 'KWD';

/** Kept in step with `supportedCurrencies` on the checkout page and the courses catalog. */
export const BOOK_CURRENCIES = ['KWD', 'SAR', 'AED', 'USD', 'EUR'] as const;
export type BookCurrency = (typeof BOOK_CURRENCIES)[number];

/**
 * The currency must come from the same payload that produced `amount`. Formatting a converted
 * amount with a hardcoded currency is what made the checkout show a KWD figure while charging
 * a converted one.
 */
export function formatBookPrice(amount: number, isAr: boolean, currency: string = BOOK_BASE_CURRENCY) {
  return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', { style: 'currency', currency }).format(amount);
}

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
    categoryId: item.book_category?.id != null ? String(item.book_category.id) : '',
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
    currency: item.currency || BOOK_BASE_CURRENCY,
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

export interface BookCatalogQuery {
  search?: string;
  page?: number;
  perPage?: number;
  categoryId?: string;
  currency?: string;
  priceFrom?: number;
  priceTo?: number;
  sort?: 'newest' | 'oldest';
}

export async function getApiBooks(query?: BookCatalogQuery) {
  const currency = query?.currency || BOOK_BASE_CURRENCY;
  const response = await apiFetch<BookApiItem[] | Paginated<BookApiItem>>('/api/user/books', {
    query: {
      'filters[search]': query?.search,
      'filters[book_category_id]': query?.categoryId,
      // The price filter is interpreted in `currency` server-side (Book::applyCatalogPriceFilters),
      // so both must travel together or the range is applied against the wrong scale.
      'filters[currency]': currency,
      'filters[price_from]': query?.priceFrom,
      'filters[price_to]': query?.priceTo,
      'filters[sort]': query?.sort,
      // Also read off the query string by the resource, to convert the returned prices.
      currency,
      page: query?.page,
      per_page: query?.perPage ?? 50,
    },
  });
  return getItems(response).map(mapBook);
}

export async function getApiFeaturedBooks(limit = 4, currency: string = BOOK_BASE_CURRENCY) {
  const response = await apiFetch<BookApiItem[] | Paginated<BookApiItem>>('/api/user/books/featured', {
    query: { per_page: limit, currency },
  });
  return getItems(response).map(mapBook).slice(0, limit);
}

export async function getApiBookDetail(id: string, currency: string = BOOK_BASE_CURRENCY): Promise<BookDetail> {
  const response = await apiFetch<BookDetailApiResponse>(`/api/user/books/${id}`, { query: { currency } });
  return {
    ...mapBook(response.book),
    similarBooks: (response.similar_books || []).map(mapBook),
    isFavorited: Boolean(response.book.is_favorited),
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
  return resolveApiUrl(`/api/user/my-books/${orderId}/invoice`);
}

export function getBookStreamUrl(bookId: string) {
  return resolveApiUrl(`/api/v1/user/books/${bookId}/stream-ebook`);
}
