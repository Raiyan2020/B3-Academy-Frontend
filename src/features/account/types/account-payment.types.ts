// Backend contract: GET /api/user/account/payments (paginated AccountPaymentResource).

export type AccountPaymentType =
  | 'subscription'
  | 'book'
  | 'course'
  | 'trip_package'
  | 'clinic_initial_consultation'
  | 'clinic_appointment'
  | 'individual_consultation'
  | 'trip_initial_consultation'
  | 'care_booking'
  | 'payment';

export interface AccountPaymentMethod {
  id: number | null;
  driver: string;
  name: string;
  image?: string | null;
}

// Present only when status === 'success'. `pdfDownloadUrl` is an absolute PUBLIC url (no auth).
export interface AccountPaymentInvoice {
  invoiceNumber: string;
  qrCodeUrl?: string | null;
  webViewUrl?: string | null;
  pdfDownloadUrl?: string | null;
  imageDownloadUrl?: string | null;
}

export interface AccountPaymentApiItem {
  id: string;
  type: AccountPaymentType | string;
  typeLabel: string;
  contentName?: string;
  date: string;
  amount: number;
  currency: string;
  paymentMethod: AccountPaymentMethod;
  status: string;
  statusLabel: string;
  isSuccess: boolean;
  invoice?: AccountPaymentInvoice;
  relatedEndpoint?: string;
}

export interface PaymentPagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface AccountPaymentsResult {
  items: AccountPaymentApiItem[];
  pagination: PaymentPagination;
}
