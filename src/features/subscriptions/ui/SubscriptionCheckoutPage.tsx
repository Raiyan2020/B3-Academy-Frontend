'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../../LanguageContext';
import {
  useCheckoutSubscription,
  useMySubscription,
  usePaymentMethods,
  useSubscriptionPlan,
} from '../hooks/use-subscriptions';
import type { SubscriptionCurrency } from '../types/api.types';

const currencies: SubscriptionCurrency[] = ['KWD', 'SAR', 'AED', 'USD', 'EUR'];

function createIdempotencyKey(planId: string) {
  return `sub_${planId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function SubscriptionCheckoutPage({ planId }: { planId: string }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [currency, setCurrency] = useState<SubscriptionCurrency>('KWD');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [transactionMessage, setTransactionMessage] = useState('');
  const planQuery = useSubscriptionPlan(planId, currency);
  const methodsQuery = usePaymentMethods();
  const mySubscriptionQuery = useMySubscription();
  const checkout = useCheckoutSubscription();
  const hasActiveSubscription = Boolean(mySubscriptionQuery.data?.active);

  const price = useMemo(() => {
    if (!planQuery.data) return '-';
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: planQuery.data.currency,
    }).format(planQuery.data.convertedPrice);
  }, [isAr, planQuery.data]);

  const handleCheckout = () => {
    if (!paymentMethodId || hasActiveSubscription) return;
    checkout.mutate(
      { planId, paymentMethodId, currency, idempotencyKey: createIdempotencyKey(planId) },
      {
        onSuccess: (transaction) => {
          if (transaction.payment_url) {
            window.location.href = transaction.payment_url;
            return;
          }
          setTransactionMessage(transaction.message || transaction.status_label || (isAr ? 'تم إنشاء عملية الدفع.' : 'Checkout request created.'));
        },
      },
    );
  };

  if (planQuery.isLoading || methodsQuery.isLoading || mySubscriptionQuery.isLoading) {
    return <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">{isAr ? 'جار تحميل الدفع...' : 'Loading checkout...'}</main>;
  }

  if (!planQuery.data) {
    return <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">{isAr ? 'الخطة غير متاحة.' : 'Plan is unavailable.'}</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">{isAr ? 'دفع الاشتراك' : 'Subscription checkout'}</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">{planQuery.data.name}</h1>
        {planQuery.data.description && <p className="mt-3 text-sm leading-6 text-slate-600">{planQuery.data.description}</p>}

        <div className="mt-6 rounded-md bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-700">{isAr ? 'الإجمالي' : 'Total'}</span>
            <span className="text-2xl font-bold text-emerald-700">{price}</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {isAr ? `${planQuery.data.durationMonths} شهر، تجديد يدوي فقط.` : `${planQuery.data.durationMonths} month plan, manual renewal only.`}
          </p>
        </div>

        {hasActiveSubscription ? (
          <div className="mt-6 rounded-md border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {isAr ? 'لديك اشتراك فعال حالياً ولا يمكنك شراء خطة جديدة قبل انتهائه.' : 'You already have an active subscription and cannot buy a new plan until it ends.'}
          </div>
        ) : (
          <>
            <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'العملة' : 'Currency'}</label>
            <select value={currency} onChange={(event) => setCurrency(event.target.value as SubscriptionCurrency)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
              {currencies.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'طريقة الدفع' : 'Payment method'}</label>
            <select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
              <option value="">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</option>
              {(methodsQuery.data || []).map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!paymentMethodId || checkout.isPending}
              onClick={handleCheckout}
              className="mt-6 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600"
            >
              {checkout.isPending ? (isAr ? 'جار إنشاء الدفع...' : 'Creating checkout...') : isAr ? 'إتمام الدفع' : 'Pay now'}
            </button>
          </>
        )}

        {transactionMessage && (
          <div className="mt-6 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            {transactionMessage}
          </div>
        )}
        <Link href="/dashboard/subscription" className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'عرض اشتراكي' : 'View my subscription'}
        </Link>
      </section>
    </main>
  );
}
