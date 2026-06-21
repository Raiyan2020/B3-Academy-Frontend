'use client';

import { CheckCircle2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { useAuth } from '@/features/auth/auth-provider';
import { AuthActionGate } from '@/features/access/components/auth-action-gate';
import type { CurrencyCode } from '@/features/business/business.types';
import { formatPlanDuration, getActiveSubscriptionPlans, getPlanPrice } from '@/features/subscriptions/services/subscriptions.service';

const currencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'AED', 'JPY', 'CNH'];

export function SubscriptionsPage() {
  const { language, localize } = useLanguage();
  const { user } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const plans = useMemo(() => getActiveSubscriptionPlans(), []);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{language === 'ar' ? 'الاشتراكات' : 'Subscriptions'}</p>
          <h1 className="max-w-3xl text-4xl font-bold text-slate-950">
            {language === 'ar' ? 'اختر خطة الاشتراك المناسبة' : 'Choose the right subscription plan'}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {language === 'ar'
              ? 'الاشتراك يفتح المحتوى المقفول طوال مدة الخطة. لا يوجد تجديد تلقائي، ولا يمكن شراء خطة جديدة أثناء وجود اشتراك فعّال.'
              : 'A subscription unlocks locked content for the plan duration. There is no auto-renewal, and a new plan cannot be purchased while one is active.'}
          </p>
          <label className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
            {language === 'ar' ? 'العملة' : 'Currency'}
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              {currencies.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">{localize(plan.name)}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{localize(plan.description)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-emerald-700" />
            </div>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-bold text-emerald-700">{getPlanPrice(plan, currency)}</span>
              <span className="pb-1 text-sm font-semibold text-slate-500">{currency}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{formatPlanDuration(plan.durationDays, language === 'ar' ? 'ar' : 'en')}</p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature.en} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  {localize(feature)}
                </li>
              ))}
            </ul>
            {user?.isSubscribed ? (
              <button disabled className="mt-7 w-full rounded-md bg-slate-300 px-4 py-3 font-semibold text-slate-600">
                {language === 'ar' ? 'اشتراك فعّال حالياً' : 'Subscription active'}
              </button>
            ) : user ? (
              <Link
                href={`/checkout/subscription/${plan.id}`}
                className="mt-7 flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800"
              >
                {language === 'ar' ? 'شراء الخطة' : 'Buy plan'}
              </Link>
            ) : (
              <AuthActionGate
                intent={{
                  type: 'subscription.checkout',
                  href: `/checkout/subscription/${plan.id}`,
                  label: localize(plan.name),
                  itemId: plan.id,
                  itemKind: 'subscription',
                }}
              >
                {({ onClick }) => (
                  <button onClick={onClick} className="mt-7 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800">
                    {language === 'ar' ? 'شراء الخطة' : 'Buy plan'}
                  </button>
                )}
              </AuthActionGate>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
