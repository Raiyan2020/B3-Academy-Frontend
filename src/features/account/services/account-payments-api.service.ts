import { apiFetch } from '@/lib/api/base-fetch';
import type {
  AccountPaymentApiItem,
  AccountPaymentInvoice,
  AccountPaymentMethod,
  AccountPaymentsResult,
  PaymentPagination,
} from '../types/account-payment.types';

// Raw (snake_case) backend shapes.
interface RawPaymentMethod {
  id?: number | string | null;
  driver?: string | null;
  name?: string | null;
  image?: string | null;
}

interface RawInvoice {
  invoice_number?: string | null;
  qr_code_url?: string | null;
  web_view_url?: string | null;
  pdf_download_url?: string | null;
  image_download_url?: string | null;
}

interface RawPaymentItem {
  id?: number | string;
  type?: string | null;
  type_label?: string | null;
  content_name?: string | null;
  date?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  payment_method?: RawPaymentMethod | null;
  status?: string | null;
  status_label?: string | null;
  invoice?: RawInvoice | null;
  related_endpoint?: string | null;
}

interface RawPagination {
  current_page?: number | string;
  last_page?: number | string;
  per_page?: number | string;
  total?: number | string;
}

interface RawPaymentsResponse {
  items?: RawPaymentItem[];
  data?: RawPaymentItem[];
  pagination?: RawPagination | null;
}

function toNumber(value: unknown, fallback = 0): number {
  const amount = Number(value ?? fallback);
  return Number.isFinite(amount) ? amount : fallback;
}

function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const localized = value as Record<string, unknown>;
    return String(localized.ar || localized.en || localized.name || fallback);
  }
  return fallback;
}

function getItems(payload: RawPaymentsResponse | RawPaymentItem[]): RawPaymentItem[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

function mapPaymentMethod(raw: RawPaymentMethod | null | undefined): AccountPaymentMethod {
  return {
    id: raw?.id === undefined || raw?.id === null ? null : Number(raw.id),
    driver: text(raw?.driver),
    name: text(raw?.name),
    image: raw?.image ?? null,
  };
}

function mapInvoice(raw: RawInvoice | null | undefined): AccountPaymentInvoice | undefined {
  if (!raw) return undefined;
  const invoiceNumber = text(raw.invoice_number);
  const pdfDownloadUrl = raw.pdf_download_url ?? null;
  // Guard against an empty invoice object.
  if (!invoiceNumber && !pdfDownloadUrl && !raw.web_view_url) return undefined;
  return {
    invoiceNumber,
    qrCodeUrl: raw.qr_code_url ?? null,
    webViewUrl: raw.web_view_url ?? null,
    pdfDownloadUrl,
    imageDownloadUrl: raw.image_download_url ?? null,
  };
}

function mapPayment(raw: RawPaymentItem): AccountPaymentApiItem {
  const status = text(raw.status);
  return {
    id: String(raw.id ?? ''),
    type: text(raw.type),
    typeLabel: text(raw.type_label),
    contentName: raw.content_name ? text(raw.content_name) : undefined,
    date: text(raw.date),
    amount: toNumber(raw.amount),
    currency: text(raw.currency, 'KWD'),
    paymentMethod: mapPaymentMethod(raw.payment_method),
    status,
    statusLabel: text(raw.status_label),
    isSuccess: status === 'success',
    invoice: mapInvoice(raw.invoice),
    relatedEndpoint: raw.related_endpoint ? text(raw.related_endpoint) : undefined,
  };
}

function mapPagination(raw: RawPagination | null | undefined, itemsCount: number, perPage: number): PaymentPagination {
  return {
    currentPage: raw?.current_page !== undefined ? toNumber(raw.current_page, 1) : 1,
    lastPage: raw?.last_page !== undefined ? toNumber(raw.last_page, 1) : 1,
    perPage: raw?.per_page !== undefined ? toNumber(raw.per_page, perPage) : perPage,
    total: raw?.total !== undefined ? toNumber(raw.total, itemsCount) : itemsCount,
  };
}

export interface GetAccountPaymentsParams {
  perPage?: number;
  page?: number;
}

export async function getAccountPayments(
  { perPage = 15, page }: GetAccountPaymentsParams = {},
): Promise<AccountPaymentsResult> {
  const safePerPage = Math.min(Math.max(Math.trunc(perPage) || 15, 1), 100);
  const response = await apiFetch<RawPaymentsResponse | RawPaymentItem[]>('/api/user/account/payments', {
    query: { per_page: safePerPage, page },
  });
  const items = getItems(response).map(mapPayment);
  const pagination = Array.isArray(response)
    ? mapPagination(undefined, items.length, safePerPage)
    : mapPagination(response.pagination, items.length, safePerPage);
  return { items, pagination };
}
