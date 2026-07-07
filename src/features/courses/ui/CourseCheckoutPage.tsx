'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../../LanguageContext';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import { useCheckoutCourse, useCourseApiDetail } from '../hooks/use-course-api';
import type { CoursePaymentMode } from '../types/api.types';

function createIdempotencyKey(courseId: string) {
  return `course_${courseId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function CourseCheckoutPage({ courseId }: { courseId: string }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [currency, setCurrency] = useState('USD');
  const [paymentMode, setPaymentMode] = useState<CoursePaymentMode>('full');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [transactionMessage, setTransactionMessage] = useState('');
  const courseQuery = useCourseApiDetail(courseId, currency);
  const methodsQuery = usePaymentMethods();
  const checkout = useCheckoutCourse();

  const course = courseQuery.data;
  const price = useMemo(() => {
    if (!course) return '-';
    const amount = paymentMode === 'installments' && course.installmentCount ? course.price / course.installmentCount : course.price;
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: course.currency,
    }).format(amount);
  }, [course, isAr, paymentMode]);

  const handleCheckout = () => {
    if (!paymentMethodId || !course) return;
    checkout.mutate(
      {
        courseId: course.id,
        paymentMethodId,
        currency,
        paymentMode,
        installmentNumber: paymentMode === 'installments' ? 1 : undefined,
        idempotencyKey: createIdempotencyKey(course.id),
      },
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

  if (courseQuery.isLoading || methodsQuery.isLoading) {
    return <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">{isAr ? 'جار تحميل الدفع...' : 'Loading checkout...'}</main>;
  }

  if (!course) {
    return <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">{isAr ? 'الدورة غير متاحة.' : 'Course is unavailable.'}</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">{isAr ? 'دفع الدورة' : 'Course checkout'}</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">{course.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{course.description}</p>
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {isAr
            ? 'Ù…Ù„Ø§Ø­Ø¸Ø©: Ù…Ø³Ø§Ø± Ø§Ù„Ø¯ÙˆØ±Ø§Øª Ù…Ø¯Ø§Ø± Ù…Ù† Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø­Ø§Ù„ÙŠØ§ Ù„Ø£Ù† Ø§Ù„Ø®Ù„ÙÙŠØ© Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ù„Ø§ ØªÙˆÙØ± API Ù„Ù„Ø¯ÙˆØ±Ø§Øª. Ø³ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø§Ù„ØªØ­Ø§Ù‚ Ù…Ø­Ù„ÙŠØ§ Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø².'
            : 'Note: Courses are frontend-managed in this build because the fixed backend does not expose course APIs. Enrollment is recorded locally on this device.'}
        </div>

        <div className="mt-6 rounded-md bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-700">{isAr ? 'الإجمالي' : 'Total'}</span>
            <span className="text-2xl font-bold text-emerald-700">{price}</span>
          </div>
        </div>

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'العملة' : 'Currency'}</label>
        <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          {['USD', 'EUR', 'GBP', 'AED', 'KWD'].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'طريقة الدفع للدورة' : 'Course payment mode'}</label>
        <select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value as CoursePaymentMode)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          {course.paymentModes.includes('full') && <option value="full">{isAr ? 'دفع كامل' : 'Full payment'}</option>}
          {course.paymentModes.includes('installments') && <option value="installments">{isAr ? 'أول قسط' : 'First installment'}</option>}
        </select>

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'طريقة الدفع' : 'Payment method'}</label>
        <select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          <option value="">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</option>
          {(methodsQuery.data || []).map((method) => (
            <option key={method.id} value={method.id}>{method.name}</option>
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

        {transactionMessage && (
          <div className="mt-6 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            {transactionMessage}
          </div>
        )}
        <Link href="/dashboard/courses" className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'عرض دوراتي' : 'View my courses'}
        </Link>
      </section>
    </main>
  );
}
