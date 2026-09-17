'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '@/LanguageContext';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import { useApiBookDetail, useCheckoutBook } from '../hooks/use-books-api';
import { formatBookPrice } from '../services/books-api.service';
import type { BookPurchaseFormat } from '../types/book-purchase.types';
import { useBackendAddresses, useBackendAddressActions } from '@/features/account/hooks/use-account-api';

function createIdempotencyKey(bookId: string) {
  return `book_${bookId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const supportedCurrencies = ['KWD', 'SAR', 'AED', 'USD', 'EUR'] as const;

// Required by the backend address rules (UserAddressRules), phone is optional there.
const ADDRESS_FIELDS = [
  { key: 'name', ar: 'الاسم الكامل', en: 'Full name' },
  { key: 'governorate', ar: 'المحافظة', en: 'Governorate' },
  { key: 'area', ar: 'المنطقة', en: 'Area' },
  { key: 'block', ar: 'القطعة', en: 'Block' },
  { key: 'street', ar: 'الشارع', en: 'Street' },
  { key: 'building', ar: 'المبنى', en: 'Building' },
] as const;

const EMPTY_ADDRESS = { name: '', governorate: '', area: '', block: '', street: '', building: '' };

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
  const backendAddresses = useBackendAddresses();
  const addressActions = useBackendAddressActions();
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const book = bookQuery.data;
  const requiresAddress = format === 'physical' || format === 'bundle';
  const addresses = backendAddresses.data?.length ? backendAddresses.data : user?.addresses || [];

  // The catalog price is in the backend base currency; the selected currency below is only the
  // currency the payment is charged in (the backend converts it at checkout).
  const price = useMemo(() => (book ? formatBookPrice(book.prices[format], isAr) : '-'), [book, format, isAr]);

  const canSaveAddress = ADDRESS_FIELDS.every((field) => newAddress[field.key].trim().length >= 2);

  const handleSaveAddress = () => {
    if (!canSaveAddress) return;
    addressActions.create.mutate(newAddress, {
      onSuccess: (address) => {
        setUserAddressId(address.id);
        setNewAddress(EMPTY_ADDRESS);
      },
    });
  };

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

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'عملة الدفع' : 'Payment currency'}</label>
        <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          {supportedCurrencies.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'طريقة الدفع' : 'Payment method'}</label>
        <select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
          <option value="">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</option>
          {(methodsQuery.data || []).map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
        </select>

        {requiresAddress && (
          <>
            <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'عنوان الشحن' : 'Shipping address'}</label>
            {addresses.length > 0 && (
              <select value={userAddressId} onChange={(event) => setUserAddressId(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
                <option value="">{isAr ? 'اختر عنوان الشحن' : 'Select shipping address'}</option>
                {addresses.map((address) => <option key={address.id} value={address.id}>{address.name} - {address.area}</option>)}
              </select>
            )}

            {addresses.length === 0 && (
              <div className="mt-2 rounded-md border border-slate-200 p-4">
                <p className="text-sm text-slate-600">{isAr ? 'لا يوجد عنوان محفوظ. أضف عنوان الشحن لإتمام الطلب.' : 'No saved address yet. Add a shipping address to complete the order.'}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {ADDRESS_FIELDS.map((field) => (
                    <input
                      key={field.key}
                      value={newAddress[field.key]}
                      onChange={(event) => setNewAddress((current) => ({ ...current, [field.key]: event.target.value }))}
                      placeholder={isAr ? field.ar : field.en}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  ))}
                </div>
                <button type="button" disabled={!canSaveAddress || addressActions.create.isPending} onClick={handleSaveAddress} className="mt-3 rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:border-slate-200 disabled:text-slate-400">
                  {addressActions.create.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ العنوان' : 'Save address'}
                </button>
              </div>
            )}
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
