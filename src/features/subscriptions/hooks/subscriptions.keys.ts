export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  plans: (currency: string) => [...subscriptionKeys.all, 'plans', currency] as const,
  plan: (id: string, currency: string) => [...subscriptionKeys.all, 'plan', id, currency] as const,
  paymentMethods: () => [...subscriptionKeys.all, 'payment-methods'] as const,
  mine: () => [...subscriptionKeys.all, 'me'] as const,
};

