'use client';

import { useAuth } from '@/features/auth/auth-provider';
import { getPaymentRecords } from '@/features/payments/services/payments-storage.service';
import { AccountShell, EmptyAccountState } from '../account-shell';
import { Link } from '@/lib/routing/next-router-compat';

function getCheckoutUrl(payment: any) {
  const { kind, itemId } = payment;
  if (kind === 'course-full') return `/checkout/course/${itemId}`;
  if (kind === 'course-installment') return `/checkout/course/${itemId}`;
  if (kind === 'subscription-plan') return `/checkout/subscription/${itemId}`;
  if (kind === 'book-ebook') return `/checkout/book/${itemId}/ebook`;
  if (kind === 'book-print') return `/checkout/book/${itemId}/physical`;
  if (kind === 'book-bundle') return `/checkout/book/${itemId}/bundle`;
  if (kind === 'clinic-appointment') return `/checkout/clinic-appointment/${itemId}`;
  if (kind === 'consultation-session') return `/checkout/consultation-session/${itemId}`;
  if (kind === 'consultation-package') return `/checkout/consultation-package/${itemId}`;
  if (kind === 'trip-package') return `/checkout/trip-package/${itemId}`;
  return `/checkout/course/${itemId}`;
}

export function PaymentsPage() {
  const { user } = useAuth();
  const payments = user ? getPaymentRecords(user.id) : [];

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
              <span>{new Date(payment.createdAt).toLocaleDateString('ar-EG')}</span>
              <span>{payment.amount} {payment.currency}</span>
              <span className={payment.status === 'successful' ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
                {payment.status === 'successful' ? 'ناجحة' : payment.status === 'failed' ? 'فاشلة' : payment.status}
              </span>
              {payment.status === 'successful' && payment.invoice ? (
                <a
                  href={payment.invoice.downloadUrl}
                  download={`${payment.invoice.id}.html`}
                  className="text-start font-semibold text-emerald-700 hover:underline"
                >
                  تحميل الفاتورة
                </a>
              ) : (
                <Link
                  to={getCheckoutUrl(payment)}
                  className="text-start font-semibold text-emerald-700 hover:underline"
                >
                  إعادة المحاولة
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
