'use client';

import { useState } from 'react';
import { AccountShell, EmptyAccountState } from '@/features/account/components/account-shell';
import { downloadAuthenticatedFile } from '@/lib/api/download';
import { toastError } from '@/lib/feedback/toast';
import { useAccountTripPackages } from '../hooks/use-trips-api';
import { getTripPackageInvoiceUrl } from '../services/trips-api.service';
import type { TripPackageOrder } from '../types/api.types';

export function PurchasedTripsPage() {
  const ordersQuery = useAccountTripPackages();
  const orders = ordersQuery.data?.items ?? [];
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleInvoice = async (order: TripPackageOrder) => {
    setDownloadingId(order.id);
    try {
      await downloadAuthenticatedFile(getTripPackageInvoiceUrl(order.id), `trip-invoice-${order.id}.pdf`);
    } catch {
      toastError('تعذر تحميل الفاتورة.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <AccountShell title="باقات الرحلات المشتراة" description="عمليات شراء باقات الرحلات. تنفيذ الرحلة يتم بالتنسيق مع الإدارة خارج المنصة.">
      {ordersQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">جاري تحميل الباقات...</div>
      ) : ordersQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-white p-8 text-center text-red-600">تعذر تحميل باقات الرحلات.</div>
      ) : orders.length === 0 ? (
        <EmptyAccountState title="لا توجد باقات رحلات مشتراة" description="بعد شراء باقة رحلة ستظهر هنا مع الفاتورة." />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="p-5">
                <h2 className="font-bold text-slate-950">{order.packageName}</h2>
                <p className="mt-2 text-sm font-bold text-emerald-700">
                  السعر: {order.amount} {order.currency}
                </p>
                {order.purchasedAt && (
                  <p className="mt-2 text-sm text-slate-600">تاريخ الشراء: {order.purchasedAt}</p>
                )}
                <p className="mt-2 text-sm font-semibold">الحالة: {order.statusLabel || order.status}</p>
                <p className="mt-2 text-sm text-slate-600">تنفيذ الرحلة يتم بالتنسيق مع الإدارة خارج المنصة.</p>
                {(order.invoice || order.status === 'purchased') && (
                  <button
                    type="button"
                    onClick={() => handleInvoice(order)}
                    disabled={downloadingId === order.id}
                    className="mt-4 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {downloadingId === order.id ? 'جاري التحميل...' : 'تحميل الفاتورة'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
