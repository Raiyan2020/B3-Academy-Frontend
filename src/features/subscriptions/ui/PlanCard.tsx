import { CheckCircle2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { AuthActionGate } from '@/features/access/components/auth-action-gate';
import type { SubscriptionPlan } from '../types/api.types';
import { RichText } from '@/components/ui/rich-text';

export function PlanCard({
  plan,
  isAr,
  isSignedIn,
  hasActiveSubscription,
}: {
  plan: SubscriptionPlan;
  isAr: boolean;
  isSignedIn: boolean;
  hasActiveSubscription: boolean;
}) {
  const price = new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: plan.currency,
  }).format(plan.convertedPrice);

  return (
    <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">{plan.name}</h2>
          {plan.description && <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description}</p>}
        </div>
        <CreditCard className="h-8 w-8 text-emerald-700" />
      </div>
      <div className="mt-6">
        <p className="text-4xl font-bold text-emerald-700">{price}</p>
        <p className="mt-2 text-sm text-slate-500">
          {isAr ? `${plan.durationMonths} شهر` : `${plan.durationMonths} month${plan.durationMonths === 1 ? '' : 's'}`}
        </p>
      </div>
      {plan.features.length > 0 && (
        <div className="mt-6 flex-1 space-y-3">
          {plan.features.map((feature, index) => (
            <div key={`${plan.id}-feature-${index}`} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <RichText html={feature} className="min-w-0 flex-1 [&_li]:my-0 [&_ul]:space-y-2" />
            </div>
          ))}
        </div>
      )}
      {hasActiveSubscription ? (
        <button disabled className="mt-7 w-full rounded-md bg-slate-300 px-4 py-3 font-semibold text-slate-600">
          {isAr ? 'لديك اشتراك فعال' : 'Active subscription exists'}
        </button>
      ) : isSignedIn ? (
        <Link href={`/checkout/subscription/${plan.id}`} className="mt-7 flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800">
          {isAr ? 'شراء الخطة' : 'Buy plan'}
        </Link>
      ) : (
        <AuthActionGate
          intent={{
            type: 'subscription.checkout',
            href: `/checkout/subscription/${plan.id}`,
            label: plan.name,
            itemId: plan.id,
            itemKind: 'subscription',
          }}
        >
          {({ onClick }) => (
            <button onClick={onClick} className="mt-7 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800">
              {isAr ? 'شراء الخطة' : 'Buy plan'}
            </button>
          )}
        </AuthActionGate>
      )}
    </article>
  );
}
