export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  plans: (currency: string, language: string) => [...subscriptionKeys.all, 'plans', currency, language] as const,
  plan: (id: string, currency: string, language: string) => [...subscriptionKeys.all, 'plan', id, currency, language] as const,
  paymentMethods: () => [...subscriptionKeys.all, 'payment-methods'] as const,
  mine: () => [...subscriptionKeys.all, 'me'] as const,
};
