import Link from 'next/link';
import { EmptyAccountState, InfoRow } from '@/features/account/components/account-shell';
import type { SubscriptionRecord } from '../types/api.types';
import { SubscriptionHistoryTable } from './SubscriptionHistoryTable';

export function SubscriptionAccountPanel({
  active,
  history,
  isLoading,
  isAr,
}: {
  active?: SubscriptionRecord | null;
  history: SubscriptionRecord[];
  isLoading: boolean;
  isAr: boolean;
}) {
  if (isLoading) {
    return <p className="text-sm text-slate-500">{isAr ? 'جار تحميل الاشتراك...' : 'Loading subscription...'}</p>;
  }

  return (
    <>
      {active ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-950">{isAr ? 'الخطة الحالية' : 'Current plan'}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow label={isAr ? 'اسم الخطة' : 'Plan'} value={active.planName} />
            <InfoRow label={isAr ? 'السعر' : 'Price'} value={`${active.paidAmount} ${active.currency}`} />
            <InfoRow label={isAr ? 'تاريخ البدء' : 'Start date'} value={active.startsAt || '-'} />
            <InfoRow label={isAr ? 'تاريخ الانتهاء' : 'End date'} value={active.endsAt || '-'} />
            <InfoRow label={isAr ? 'الحالة' : 'Status'} value={active.statusLabel} />
            <InfoRow label={isAr ? 'طريقة الدفع' : 'Payment method'} value={active.paymentMethod || '-'} />
            <InfoRow
              label={isAr ? 'الفاتورة' : 'Invoice'}
              value={
                active.invoiceUrl ? (
                  <a href={active.invoiceUrl} className="font-semibold text-emerald-700 hover:underline">
                    {isAr ? 'تحميل الفاتورة' : 'Download invoice'}
                  </a>
                ) : (
                  isAr ? 'غير متاحة' : 'Unavailable'
                )
              }
            />
          </div>
        </div>
      ) : (
        <>
          <EmptyAccountState
            title={isAr ? 'لا يوجد اشتراك فعال' : 'No active subscription'}
            description={isAr ? 'يمكنك شراء خطة اشتراك من صفحة الاشتراكات.' : 'You can buy a plan from the subscriptions page.'}
          />
          <Link href="/subscriptions" className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white">
            {isAr ? 'تصفح خطط الاشتراك' : 'Browse plans'}
          </Link>
        </>
      )}
      <SubscriptionHistoryTable records={history} isAr={isAr} />
    </>
  );
}

