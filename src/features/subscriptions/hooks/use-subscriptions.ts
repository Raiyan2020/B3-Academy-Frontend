'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkoutSubscription,
  getMySubscription,
  getPaymentMethods,
  getSubscriptionPlan,
  getSubscriptionPlans,
} from '../services/subscriptions-api.service';
import type { CheckoutSubscriptionInput } from '../types/api.types';
import { subscriptionKeys } from './subscriptions.keys';

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

export function useMySubscription(enabled = true) {
  return useQuery({
    queryKey: subscriptionKeys.mine(),
    queryFn: getMySubscription,
    enabled,
  });
}

export function useCheckoutSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckoutSubscriptionInput) => checkoutSubscription(input),
    meta: { successMessage: 'Checkout request created.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine() });
    },
  });
}
