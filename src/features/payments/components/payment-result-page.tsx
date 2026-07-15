'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';

export type PaymentResultStatus = 'success' | 'failed' | 'pending';

// These pages are the browser landing points the payment gateway redirects to after
// checkout (backend PaymentCallbackController -> FRONT_URL + /order-success|/order-fail|/order-pending).
export function PaymentResultPage({ status }: { status: PaymentResultStatus }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const config = {
    success: {
      Icon: CheckCircle2,
      iconClass: 'text-emerald-600',
      title: isAr ? 'تمت عملية الدفع بنجاح' : 'Payment successful',
      desc: isAr
        ? 'تم تأكيد عملية الدفع. يمكنك متابعة تفاصيل الطلب والفاتورة من حسابك.'
        : 'Your payment was confirmed. You can review the order and invoice from your account.',
    },
    failed: {
      Icon: XCircle,
      iconClass: 'text-red-600',
      title: isAr ? 'فشلت عملية الدفع' : 'Payment failed',
      desc: isAr
        ? 'لم تكتمل عملية الدفع. لم يتم خصم أي مبلغ. يمكنك المحاولة مرة أخرى.'
        : 'The payment could not be completed. No amount was charged. You can try again.',
    },
    pending: {
      Icon: Clock,
      iconClass: 'text-amber-600',
      title: isAr ? 'الدفع قيد المراجعة' : 'Payment pending',
      desc: isAr
        ? 'عملية الدفع قيد المعالجة. سيتم تحديث حالة الطلب بمجرد اكتمالها.'
        : 'Your payment is being processed. The order status will update once it completes.',
    },
  }[status];

  const { Icon } = config;

  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Icon className={`mx-auto h-14 w-14 ${config.iconClass}`} />
        <h1 className="mt-5 text-2xl font-bold text-slate-950">{config.title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{config.desc}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard/payments" className="rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white">
            {isAr ? 'عرض المدفوعات والفواتير' : 'View payments & invoices'}
          </Link>
          <Link href="/" className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">
            {isAr ? 'العودة للرئيسية' : 'Back to home'}
          </Link>
        </div>
      </div>
    </main>
  );
}
