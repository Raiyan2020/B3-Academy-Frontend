'use client';

import { useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { useAuth } from '@/features/auth/auth-provider';
import { useMySubscription, useSubscriptionPlans } from '../hooks/use-subscriptions';
import type { SubscriptionCurrency } from '../types/api.types';
import { PlanList } from './PlanList';

const currencies: SubscriptionCurrency[] = ['KWD', 'USD', 'EUR', 'GBP', 'AED'];

export function SubscriptionsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';
  const [currency, setCurrency] = useState<SubscriptionCurrency>('KWD');
  const plansQuery = useSubscriptionPlans(currency);
  const mySubscriptionQuery = useMySubscription(Boolean(user));
  const hasActiveSubscription = Boolean(mySubscriptionQuery.data?.active);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{isAr ? 'الاشتراكات' : 'Subscriptions'}</p>
          <h1 className="max-w-3xl text-4xl font-bold text-slate-950">
            {isAr ? 'اختر خطة الاشتراك المناسبة' : 'Choose the right subscription plan'}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {isAr
              ? 'الاشتراك يفتح المحتوى المقفول طوال مدة الخطة. التجديد يدوي ولا يمكن شراء خطة جديدة أثناء وجود اشتراك فعال.'
              : 'A subscription unlocks protected content for the plan duration. Renewal is manual, and a new plan cannot be purchased while one is active.'}
          </p>
          <label className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
            {isAr ? 'العملة' : 'Currency'}
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as SubscriptionCurrency)}
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
      <PlanList
        plans={plansQuery.data || []}
        isLoading={plansQuery.isLoading}
        isAr={isAr}
        isSignedIn={Boolean(user)}
        hasActiveSubscription={hasActiveSubscription}
      />
    </main>
  );
}

