'use client';

import { useLanguage } from '../../../../../LanguageContext';
import { AccountShell } from '../account-shell';
import { useMySubscription } from '@/features/subscriptions/hooks/use-subscriptions';
import { SubscriptionAccountPanel } from '@/features/subscriptions/ui/SubscriptionAccountPanel';

export function AccountSubscriptionPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const subscriptionQuery = useMySubscription();

  return (
    <AccountShell
      title={isAr ? 'اشتراكي' : 'My subscription'}
      description={isAr ? 'حالة الاشتراك الحالية وسجل الاشتراكات السابقة. التجديد يدوي فقط.' : 'Current subscription status and previous subscription history. Renewal is manual only.'}
    >
      <SubscriptionAccountPanel
        active={subscriptionQuery.data?.active}
        history={subscriptionQuery.data?.history || []}
        isLoading={subscriptionQuery.isLoading}
        isAr={isAr}
      />
    </AccountShell>
  );
}

