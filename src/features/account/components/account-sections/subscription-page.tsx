'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { getSubscriptionHistory } from '@/features/subscriptions/services/subscription-history.service';
import { AccountShell, EmptyAccountState, InfoRow } from '../account-shell';

export function AccountSubscriptionPage() {
  const { user } = useAuth();
  const active = Boolean(user?.isSubscribed);
  const history = user ? getSubscriptionHistory(user.id) : [];

  return (
    <AccountShell title="اشتراكي" description="حالة الاشتراك الحالية وسجل الاشتراكات السابقة. التجديد يدوي فقط.">
      {active ? (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoRow label="الحالة" value="فعّال" />
          <InfoRow label="تاريخ الانتهاء" value={user?.subscriptionExpiryDate ? new Date(user.subscriptionExpiryDate).toLocaleDateString('ar-EG') : 'غير محدد'} />
          <InfoRow label="التجديد" value="يدوي بعد انتهاء الاشتراك" />
          <InfoRow label="تغيير الخطة" value="غير متاح أثناء الاشتراك الفعّال" />
        </div>
      ) : (
        <EmptyAccountState title="لا يوجد اشتراك فعّال" description="يمكنك شراء خطة اشتراك من صفحة الاشتراكات." />
      )}
      {!active && <Link href="/subscriptions" className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white">تصفح خطط الاشتراك</Link>}
      {history.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4 font-bold text-slate-950">سجل الاشتراكات</div>
          {history.map((record) => (
            <div key={record.id} className="grid gap-2 border-b border-slate-100 p-4 text-sm md:grid-cols-5">
              <span className="font-semibold">{record.planName}</span>
              <span>{new Date(record.startedAt).toLocaleDateString('ar-EG')}</span>
              <span>{new Date(record.expiresAt).toLocaleDateString('ar-EG')}</span>
              <span>{record.amount} {record.currency}</span>
              <span className={record.status === 'active' ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500'}>{record.status === 'active' ? 'فعّال' : 'منتهي'}</span>
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
