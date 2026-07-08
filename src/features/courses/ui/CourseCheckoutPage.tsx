'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../../LanguageContext';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import { useCheckoutCourse, useCourseCheckoutPreview } from '../hooks/use-course-api';
import type { BackendCourseOrderType } from '../types/api.types';

function createIdempotencyKey(courseId: string) {
  return `course_${courseId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function CourseCheckoutPage({ courseId }: { courseId: string }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [currency, setCurrency] = useState('USD');
  const [orderType, setOrderType] = useState<BackendCourseOrderType>('full');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [courseSectionId, setCourseSectionId] = useState('');
  const [transactionMessage, setTransactionMessage] = useState('');
  const previewQuery = useCourseCheckoutPreview(courseId, currency);
  const methodsQuery = usePaymentMethods();
  const checkout = useCheckoutCourse();

  const course = previewQuery.data?.course;
  const sectionOptions = previewQuery.data?.sections || [];
  const supportsFullPayment = previewQuery.data?.supportsFullPayment ?? true;
  const supportsSectionPayment = previewQuery.data?.supportsSectionPayment ?? false;
  const isSectionPayment = orderType === 'section' && supportsSectionPayment;

  useEffect(() => {
    if (!supportsSectionPayment && orderType === 'section') setOrderType('full');
  }, [orderType, supportsSectionPayment]);

  useEffect(() => {
    if (!supportsFullPayment && supportsSectionPayment && orderType === 'full') setOrderType('section');
  }, [orderType, supportsFullPayment, supportsSectionPayment]);

  useEffect(() => {
    if (!isSectionPayment) setCourseSectionId('');
  }, [isSectionPayment]);

  const fullPriceLabel = useMemo(() => {
    const price = previewQuery.data?.fullPrice || course?.rawPrice;
    if (!price) return '-';
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: price.currency || course?.currency || currency,
    }).format(price.amount ?? course?.price ?? 0);
  }, [course, currency, isAr, previewQuery.data?.fullPrice]);

  const paymentCurrencies = useMemo(() => ['USD', 'EUR', 'AED', 'KWD', 'SAR'], []);

  const hasExplicitNextPayable = sectionOptions.some((section) => section.isNextPayable === true);
  const isSectionSelectable = (section: (typeof sectionOptions)[number]) => {
    if (section.isPaid) return false;
    if (hasExplicitNextPayable) return section.isNextPayable === true;
    return section.isPayable !== false && section.isAccessible !== false;
  };
  const selectedSection = sectionOptions.find((section) => section.id === courseSectionId && isSectionSelectable(section));

  useEffect(() => {
    if (isSectionPayment && courseSectionId && !selectedSection) setCourseSectionId('');
  }, [courseSectionId, isSectionPayment, selectedSection]);

  const handleCheckout = () => {
    if (!paymentMethodId || !course) return;

    const nextSectionId = isSectionPayment ? selectedSection?.id : undefined;
    if (isSectionPayment && !nextSectionId) return;

    checkout.mutate(
      {
        courseId: course.id,
        paymentMethodId,
        currency,
        orderType: isSectionPayment ? 'section' : 'full',
        courseSectionId: nextSectionId,
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

  if (previewQuery.isLoading || methodsQuery.isLoading) {
    return <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">{isAr ? 'جار تحميل الدفع...' : 'Loading checkout...'}</main>;
  }

  if (previewQuery.isError || methodsQuery.isError) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="mx-auto max-w-xl rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-red-700">{isAr ? 'تعذر تحميل بيانات الدفع.' : 'Unable to load checkout data.'}</p>
          <p className="mt-2 text-sm text-slate-600">{isAr ? 'يرجى تحديث الصفحة أو المحاولة لاحقاً.' : 'Please refresh the page or try again later.'}</p>
          <Link href={`/courses/${courseId}`} className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
            {isAr ? 'العودة إلى الدورة' : 'Back to course'}
          </Link>
        </div>
      </main>
    );
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

        <div className="mt-6 rounded-md bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-700">{isAr ? 'الإجمالي' : 'Total'}</span>
            <span className="text-2xl font-bold text-emerald-700">{fullPriceLabel}</span>
          </div>
          {supportsSectionPayment && sectionOptions.length > 0 && (
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {sectionOptions.map((section) => (
                <div key={section.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2">
                  <span>{section.title}</span>
                  <span className="font-semibold text-slate-900">
                    {section.amount != null ? new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', { style: 'currency', currency: section.currency || currency }).format(section.amount) : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'العملة' : 'Currency'}</label>
        <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          {paymentCurrencies.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'طريقة الدفع' : 'Payment type'}</label>
        <select value={orderType} onChange={(event) => setOrderType(event.target.value as BackendCourseOrderType)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          {supportsFullPayment && <option value="full">{isAr ? 'دفع كامل' : 'Full payment'}</option>}
          {supportsSectionPayment && <option value="section">{isAr ? 'الدفع الجزئي' : 'Per-section payment'}</option>}
        </select>

        {isSectionPayment && sectionOptions.length > 0 && (
          <>
            <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'القسم المطلوب' : 'Section to unlock'}</label>
            <select value={courseSectionId} onChange={(event) => setCourseSectionId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
              <option value="">{isAr ? 'اختر القسم' : 'Choose a section'}</option>
              {sectionOptions.map((section) => (
                <option key={section.id} value={section.id} disabled={!isSectionSelectable(section)}>
                  {section.title}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">{isAr ? 'يسمح النظام بدفع القسم القابل للدفع التالي فقط.' : 'The backend only allows the next payable unpaid section.'}</p>
          </>
        )}

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'طريقة الدفع' : 'Payment method'}</label>
        <select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          <option value="">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</option>
          {(methodsQuery.data || []).map((method) => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!paymentMethodId || checkout.isPending || (isSectionPayment && !selectedSection)}
          onClick={handleCheckout}
          className="mt-6 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600"
        >
          {checkout.isPending ? (isAr ? 'جار إنشاء الدفع...' : 'Creating checkout...') : isAr ? 'إتمام الدفع' : 'Pay now'}
        </button>

        {transactionMessage && <div className="mt-6 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{transactionMessage}</div>}
        <Link href="/dashboard/courses" className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'عرض دوراتي' : 'View my courses'}
        </Link>
      </section>
    </main>
  );
}
