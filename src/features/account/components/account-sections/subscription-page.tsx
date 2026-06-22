'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { selectAccountSubscription } from '../../services/account-selectors.service';
import { AccountShell, EmptyAccountState, InfoRow } from '../account-shell';

export function AccountSubscriptionPage() {
  const { user } = useAuth();
  const subscription = user
    ? selectAccountSubscription(user.id, user.subscriptionExpiryDate, user.isSubscribed)
    : { isActive: false, history: [] };

  return (
    <AccountShell title="اشتراكي" description="حالة الاشتراك الحالية وسجل الاشتراكات السابقة. التجديد يدوي فقط.">
      {subscription.isActive && subscription.currentPlan ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-950">الخطة الحالية</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow label="اسم الخطة" value={subscription.currentPlan.planName} />
            <InfoRow label="السعر" value={`${subscription.currentPlan.amount} ${subscription.currentPlan.currency}`} />
            <InfoRow label="تاريخ البدء" value={subscription.currentPlan.startedAt} />
            <InfoRow label="تاريخ الانتهاء" value={subscription.currentPlan.expiresAt} />
            <InfoRow label="الحالة" value={subscription.currentPlan.statusLabel} />
            <InfoRow
              label="الفاتورة"
              value={
                subscription.currentPlan.invoiceHref ? (
                  <a href={subscription.currentPlan.invoiceHref} className="font-semibold text-emerald-700 hover:underline">
                    تحميل الفاتورة
                  </a>
                ) : (
                  'غير متاحة'
                )
              }
            />
          </div>
        </div>
      ) : subscription.isActive ? (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoRow label="الحالة" value="فعّال" />
          <InfoRow label="تاريخ الانتهاء" value={subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString('ar-EG') : 'غير محدد'} />
        </div>
      ) : (
        <EmptyAccountState title="لا يوجد اشتراك فعّال" description="يمكنك شراء خطة اشتراك من صفحة الاشتراكات." />
      )}
      {!subscription.isActive && (
        <Link href="/subscriptions" className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white">
          تصفح خطط الاشتراك
        </Link>
      )}
      {subscription.history.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4 font-bold text-slate-950">سجل الاشتراكات</div>
          {subscription.history.map((record) => (
            <div key={record.id} className="grid gap-2 border-b border-slate-100 p-4 text-sm md:grid-cols-5">
              <span className="font-semibold">{record.planName}</span>
              <span>{record.startedAt}</span>
              <span>{record.expiresAt}</span>
              <span>
                {record.amount} {record.currency}
              </span>
              <span className={record.statusLabel === 'فعّال' ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500'}>
                {record.statusLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
