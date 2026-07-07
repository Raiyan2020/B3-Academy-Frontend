'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import { useApiBookDetail, useCheckoutBook } from '../hooks/use-books-api';
import type { BookPurchaseFormat } from '../types/book-purchase.types';

function createIdempotencyKey(bookId: string) {
  return `book_${bookId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function BookCheckoutPage({ bookId, format }: { bookId: string; format: BookPurchaseFormat }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';
  const [currency, setCurrency] = useState('KWD');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [userAddressId, setUserAddressId] = useState('');
  const [transactionMessage, setTransactionMessage] = useState('');
  const bookQuery = useApiBookDetail(bookId);
  const methodsQuery = usePaymentMethods();
  const checkout = useCheckoutBook();
  const book = bookQuery.data;
  const requiresAddress = format === 'physical' || format === 'bundle';

  const price = useMemo(() => {
    if (!book) return '-';
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', { style: 'currency', currency }).format(book.prices[format]);
  }, [book, currency, format, isAr]);

  const handleCheckout = () => {
    if (!book || !paymentMethodId || (requiresAddress && !userAddressId)) return;
    checkout.mutate(
      {
        bookId: book.id,
        format,
        paymentMethodId,
        currency,
        userAddressId: requiresAddress ? userAddressId : undefined,
        idempotencyKey: createIdempotencyKey(book.id),
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

  if (bookQuery.isLoading || methodsQuery.isLoading) {
    return <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">{isAr ? 'جاري تحميل الدفع...' : 'Loading checkout...'}</main>;
  }

  if (!book || !book.availability[format]) {
    return <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">{isAr ? 'صيغة الكتاب غير متاحة.' : 'This book format is unavailable.'}</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">{isAr ? 'دفع الكتاب' : 'Book checkout'}</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">{book.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{book.description}</p>

        <div className="mt-6 rounded-md bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-700">{isAr ? 'الإجمالي' : 'Total'}</span>
            <span className="text-2xl font-bold text-emerald-700">{price}</span>
          </div>
        </div>

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'العملة' : 'Currency'}</label>
        <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          {['KWD', 'USD', 'EUR', 'GBP', 'AED'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'طريقة الدفع' : 'Payment method'}</label>
        <select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          <option value="">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</option>
          {(methodsQuery.data || []).map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
        </select>

        {requiresAddress && (
          <>
            <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'عنوان الشحن' : 'Shipping address'}</label>
            <select value={userAddressId} onChange={(event) => setUserAddressId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
              <option value="">{isAr ? 'اختر عنوان الشحن' : 'Select shipping address'}</option>
              {(user?.addresses || []).map((address) => <option key={address.id} value={address.id}>{address.name} - {address.area}</option>)}
            </select>
          </>
        )}

        <button type="button" disabled={!paymentMethodId || (requiresAddress && !userAddressId) || checkout.isPending} onClick={handleCheckout} className="mt-6 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600">
          {checkout.isPending ? (isAr ? 'جاري إنشاء الدفع...' : 'Creating checkout...') : isAr ? 'إتمام الدفع' : 'Pay now'}
        </button>

        {transactionMessage && <div className="mt-6 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{transactionMessage}</div>}
        <Link href="/dashboard/books" className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:underline">{isAr ? 'عرض كتبي' : 'View my books'}</Link>
      </section>
    </main>
  );
}
