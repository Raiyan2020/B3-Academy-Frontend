import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkoutSubscription,
  getMySubscription,
  getPaymentMethods,
  getSubscriptionPlan,
  getSubscriptionPlans,
} from '../services/subscriptions-api.service';
import { isSubscriptionRecordActive } from '../services/subscription-access.service';
import type { CheckoutSubscriptionInput } from '../types/api.types';
import { subscriptionKeys } from './subscriptions.keys';
import { useAuth } from '@/features/auth/auth-provider';

export function useSubscriptionPlans(currency: string, language: string) {
  return useQuery({
    queryKey: subscriptionKeys.plans(currency, language),
    queryFn: () => getSubscriptionPlans(currency, language),
  });
}

export function useSubscriptionPlan(id: string, currency: string, language: string) {
  return useQuery({
    queryKey: subscriptionKeys.plan(id, currency, language),
    queryFn: () => getSubscriptionPlan(id, currency, language),
    enabled: Boolean(id),
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: subscriptionKeys.paymentMethods(),
    queryFn: getPaymentMethods,
  });
}

/**
 * `enabled` defaults to "there is a signed-in user" rather than plain `true`.
 *
 * `/subscriptions/me` requires a token, so while this defaulted to enabled every
 * guest page fired it without one and took a guaranteed 401 — on all 66 public
 * routes, including the login page itself. Nothing rendered differently; it was
 * a request that could only ever fail.
 */
export function useMySubscription(enabled?: boolean) {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  return useQuery({
    queryKey: subscriptionKeys.mine(),
    queryFn: getMySubscription,
    enabled: (enabled ?? true) && isAuthenticated,
  });
}

/**
 * Whether the current user has an active subscription, per the backend
 * (`GET /subscriptions/me`) rather than the local `user.isSubscribed` /
 * `user.subscriptionExpiryDate` pair. Consumers that gate content on
 * subscription status should use this instead of the local field, so a
 * successful checkout (which invalidates `subscriptionKeys.mine()`) unlocks
 * content immediately.
 */
export function useIsSubscriptionActive(): boolean {
  const query = useMySubscription();
  return isSubscriptionRecordActive(query.data);
}

export function useCheckoutSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckoutSubscriptionInput) => checkoutSubscription(input),
    meta: { successMessage: { ar: 'تم إنشاء طلب الدفع.', en: 'Checkout request created.' } },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine() });
    },
  });
}
