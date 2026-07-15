'use client';

import { useEffect, useState } from 'react';
import { AccountShell, EmptyAccountState } from '../account-shell';
import { useAccountPayments } from '../../hooks/use-account-payments';
import { getErrorMessage, toastError } from '@/lib/feedback/toast';
import type { AccountPaymentApiItem } from '../../types/account-payment.types';

const PER_PAGE = 15;

function PaymentRow({ payment }: { payment: AccountPaymentApiItem }) {
  return (
    <div className="grid gap-2 border-b border-slate-100 p-4 text-sm md:grid-cols-6 items-center">
      <span className="font-semibold text-slate-950">{payment.contentName || payment.typeLabel}</span>
      <span>{payment.typeLabel}</span>
      <span>{payment.date}</span>
      <span>{payment.amount} {payment.currency}</span>
      <span className={payment.isSuccess ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
        {payment.statusLabel}
      </span>
      {payment.invoice?.pdfDownloadUrl ? (
        <a
          href={payment.invoice.pdfDownloadUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="text-start font-semibold text-emerald-700 hover:underline"
        >
          تحميل الفاتورة
        </a>
      ) : (
        <span />
      )}
    </div>
  );
}

export function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, isFetching } = useAccountPayments({ page, perPage: PER_PAGE });

  useEffect(() => {
    if (isError) {
      toastError(getErrorMessage(error, 'حدث خطأ أثناء تحميل عمليات الدفع، يرجى المحاولة لاحقًا.'));
    }
  }, [isError, error]);

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const currentPage = pagination?.currentPage ?? page;
  const lastPage = pagination?.lastPage ?? 1;

  return (
    <AccountShell
      title="المدفوعات والفواتير"
      description="سجل عمليات الدفع لكل الدورات والكتب والعيادات والاستشارات والرحلات والاشتراكات."
    >
      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          جاري تحميل عمليات الدفع...
        </div>
      ) : isError ? (
        <EmptyAccountState
          title="تعذّر تحميل عمليات الدفع"
          description={getErrorMessage(error, 'حدث خطأ أثناء تحميل عمليات الدفع، يرجى المحاولة لاحقًا.')}
        />
      ) : items.length === 0 ? (
        <EmptyAccountState
          title="لا توجد عمليات دفع"
          description="لا تصدر فاتورة نهائية لعملية فاشلة أو غير مكتملة، وستظهر العمليات هنا بعد تنفيذها."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {items.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isFetching}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                السابق
              </button>
              <span className="text-sm text-slate-500">
                صفحة {currentPage} من {lastPage}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => (lastPage ? Math.min(lastPage, p + 1) : p + 1))}
                disabled={currentPage >= lastPage || isFetching}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </AccountShell>
  );
}
