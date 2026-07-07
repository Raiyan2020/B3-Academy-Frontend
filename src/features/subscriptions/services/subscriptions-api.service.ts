import { apiFetch } from '@/lib/api/base-fetch';
import type {
  CheckoutSubscriptionInput,
  MySubscriptionResponse,
  PaymentMethod,
  PaymentTransaction,
  SubscriptionPlan,
  SubscriptionPlanApiItem,
  SubscriptionRecord,
  SubscriptionRecordApiItem,
} from '../types/api.types';

interface PaginatedPlans {
  items?: SubscriptionPlanApiItem[];
  data?: SubscriptionPlanApiItem[];
}

interface MySubscriptionApiResponse {
  active: SubscriptionRecordApiItem | null;
  history: SubscriptionRecordApiItem[];
}

function getPlanItems(payload: SubscriptionPlanApiItem[] | PaginatedPlans): SubscriptionPlanApiItem[] {
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || [];
}

function mapFeatures(features: SubscriptionPlanApiItem['features']): string[] {
  if (Array.isArray(features)) return features.map(String);
  if (features && typeof features === 'object') {
    return Object.values(features).flat().map(String);
  }
  return [];
}

function mapPlan(item: SubscriptionPlanApiItem): SubscriptionPlan {
  return {
    id: String(item.id),
    name: item.name,
    description: item.description || '',
    durationMonths: item.duration_months,
    price: item.price,
    baseCurrency: item.base_currency,
    convertedPrice: item.converted_price,
    currency: item.currency,
    features: mapFeatures(item.features),
    isAvailable: item.is_available,
    isSubscribed: item.is_subscribed,
  };
}

function mapSubscription(item: SubscriptionRecordApiItem): SubscriptionRecord {
  return {
    id: String(item.id),
    planName: item.plan_name || 'Subscription plan',
    durationMonths: item.plan_duration_months,
    startsAt: item.starts_at,
    endsAt: item.ends_at,
    statusValue: item.status_object?.value || item.status_object?.key,
    statusLabel: item.status_object?.label || item.status_object?.value || 'Unknown',
    paidAmount: item.paid_amount,
    baseAmount: item.base_amount,
    currency: item.currency,
    paymentMethod: item.payment_method,
    invoiceUrl: item.invoice?.download_url || item.invoice?.url || null,
  };
}

export async function getSubscriptionPlans(currency: string) {
  const response = await apiFetch<SubscriptionPlanApiItem[] | PaginatedPlans>('/api/user/subscriptions/plans', {
    query: { currency },
  });
  return getPlanItems(response).map(mapPlan);
}

export async function getSubscriptionPlan(id: string, currency: string) {
  const response = await apiFetch<SubscriptionPlanApiItem>(`/api/user/subscriptions/plans/${id}`, {
    query: { currency },
  });
  return mapPlan(response);
}

export async function getPaymentMethods() {
  const response = await apiFetch<PaymentMethod[]>('/api/user/payment-methods');
  return response.map((item) => ({ ...item, id: String(item.id) }));
}

export async function checkoutSubscription(input: CheckoutSubscriptionInput) {
  return apiFetch<PaymentTransaction>('/api/user/subscriptions/checkout', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.idempotencyKey },
    body: {
      plan_id: Number(input.planId),
      payment_method_id: Number(input.paymentMethodId),
      currency: input.currency,
      idempotency_key: input.idempotencyKey,
    },
  });
}

export async function getMySubscription(): Promise<MySubscriptionResponse> {
  const response = await apiFetch<MySubscriptionApiResponse>('/api/user/subscriptions/me');
  return {
    active: response.active ? mapSubscription(response.active) : null,
    history: response.history.map(mapSubscription),
  };
}

