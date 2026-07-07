import type { SubscriptionPlan } from '../types/api.types';
import { PlanCard } from './PlanCard';

export function PlanList({
  plans,
  isLoading,
  isAr,
  isSignedIn,
  hasActiveSubscription,
}: {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  isAr: boolean;
  isSignedIn: boolean;
  hasActiveSubscription: boolean;
}) {
  if (isLoading) {
    return <p className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-500">{isAr ? 'جار تحميل الخطط...' : 'Loading plans...'}</p>;
  }

  if (plans.length === 0) {
    return <p className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-500">{isAr ? 'لا توجد خطط اشتراك متاحة.' : 'No subscription plans are available.'}</p>;
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isAr={isAr}
          isSignedIn={isSignedIn}
          hasActiveSubscription={hasActiveSubscription}
        />
      ))}
    </section>
  );
}

