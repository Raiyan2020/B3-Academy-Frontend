export type SubscriptionCurrency = 'KWD' | 'SAR' | 'AED' | 'USD' | 'EUR';

export interface SubscriptionPlanApiItem {
  id: number;
  name: string;
  description?: string | null;
  duration_months: number;
  price: number;
  base_currency: string;
  converted_price: number;
  currency: string;
  exchange_rate?: number | null;
  features?: Record<string, string | string[]> | string[] | null;
  is_available: boolean;
  is_subscribed: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  durationMonths: number;
  price: number;
  baseCurrency: string;
  convertedPrice: number;
  currency: string;
  features: string[];
  isAvailable: boolean;
  isSubscribed: boolean;
}

export interface PaymentMethod {
  id: string;
  driver: string;
  name: string;
  image?: string | null;
}

export interface SubscriptionRecordApiItem {
  id: number;
  plan_name?: string | null;
  plan_duration_months?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status_object?: { value?: string; label?: string; key?: string } | null;
  paid_amount: number;
  base_amount: number;
  currency: string;
  payment_method?: string | null;
  invoice?: { url?: string; download_url?: string; id?: number | string } | null;
}

export interface SubscriptionRecord {
  id: string;
  planName: string;
  durationMonths?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  statusValue?: string;
  statusLabel: string;
  paidAmount: number;
  baseAmount: number;
  currency: string;
  paymentMethod?: string | null;
  invoiceUrl?: string | null;
}

export interface MySubscriptionResponse {
  active: SubscriptionRecord | null;
  history: SubscriptionRecord[];
}

export interface CheckoutSubscriptionInput {
  planId: string;
  paymentMethodId: string;
  currency: string;
  idempotencyKey: string;
}

export interface PaymentTransaction {
  id: number;
  payment_ref?: string | null;
  idempotency_key?: string | null;
  status?: string | null;
  status_label?: string | null;
  amount: number;
  base_amount: number;
  currency: string;
  exchange_rate?: number | null;
  driver?: string | null;
  payment_method?: string | { id?: number | string; name?: string | null } | null;
  payment_url?: string | null;
  message?: string | null;
  created_at?: string | null;
}
