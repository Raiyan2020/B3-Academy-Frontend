'use client';

import { useAuth } from '@/features/auth/auth-provider';
import { selectAccountPayments } from '../../services/account-selectors.service';
import { AccountShell, EmptyAccountState } from '../account-shell';
import { Link } from '@/lib/routing/next-router-compat';

export function PaymentsPage() {
  const { user } = useAuth();
  const payments = user ? selectAccountPayments(user.id) : [];

  return (
    <AccountShell title="المدفوعات والفواتير" description="سجل عمليات الدفع لكل الدورات والكتب والعيادات والاستشارات والرحلات والاشتراكات.">
      {payments.length === 0 ? (
        <EmptyAccountState title="لا توجد عمليات دفع" description="لا تصدر فاتورة نهائية لعملية فاشلة أو غير مكتملة، وستظهر العمليات هنا بعد تنفيذها." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {payments.map((payment) => (
            <div key={payment.id} className="grid gap-2 border-b border-slate-100 p-4 text-sm md:grid-cols-6 items-center">
              <span className="font-semibold text-slate-950">{payment.itemName}</span>
              <span>{payment.kind}</span>
              <span>{payment.createdAt}</span>
              <span>{payment.amount} {payment.currency}</span>
              <span className={payment.statusLabel === 'ناجحة' ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
                {payment.statusLabel}
              </span>
              {payment.invoiceHref ? (
                <a
                  href={payment.invoiceHref}
                  download
                  className="text-start font-semibold text-emerald-700 hover:underline"
                >
                  تحميل الفاتورة
                </a>
              ) : payment.retryHref ? (
                <Link
                  to={payment.retryHref}
                  className="text-start font-semibold text-emerald-700 hover:underline"
                >
                  إعادة المحاولة
                </Link>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
