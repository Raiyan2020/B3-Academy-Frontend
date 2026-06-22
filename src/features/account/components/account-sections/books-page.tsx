'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { useCurrency } from '../../../../../CurrencyContext';
import { selectAccountBooks } from '../../services/account-selectors.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function MyBooksPage() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const books = user ? selectAccountBooks(user.id) : [];

  return (
    <AccountShell title="كتبي" description="الكتب المشتراة حسب صيغة الشراء، مع قراءة النسخة الإلكترونية داخل المنصة فقط.">
      {books.length === 0 ? (
        <EmptyAccountState title="لا توجد كتب مشتراة" description="بعد شراء كتاب إلكتروني أو مطبوع سيظهر هنا." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {books.map((purchase) => (
            <article key={purchase.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">{purchase.title.ar}</h2>
              {!purchase.isAvailable && <p className="mt-1 text-sm font-semibold text-red-600">الكتاب غير متاح حالياً</p>}
              <p className="mt-2 text-sm text-slate-600">
                الصيغة: {purchase.format === 'ebook' ? 'نسخة إلكترونية (Ebook)' : purchase.format === 'physical' ? 'نسخة مطبوعة (Physical)' : 'الحزمة الكاملة (Bundle)'}
              </p>
              {purchase.price != null && (
                <p className="mt-1 text-sm text-slate-600">
                  السعر: {purchase.currency ? `${purchase.price} ${purchase.currency}` : formatPrice(purchase.price)}
                </p>
              )}
              {purchase.format !== 'ebook' && (
                <>
                  <p className="mt-1 text-sm text-emerald-700 font-bold">
                    حالة الشحن: {purchase.shipmentStatus === 'purchased' ? 'قيد التجهيز' : purchase.shipmentStatus === 'shipped' ? 'تم الشحن' : purchase.shipmentStatus === 'delivered' ? 'تم التوصيل' : 'ملغي'}
                  </p>
                  {purchase.shippingAddressLabel && (
                    <p className="mt-1 text-sm text-slate-600">عنوان الشحن: {purchase.shippingAddressLabel}</p>
                  )}
                </>
              )}
              <div className="mt-4 flex gap-3">
                {purchase.readerHref && (
                  <Link href={purchase.readerHref} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">فتح القارئ</Link>
                )}
                <Link href={purchase.detailHref} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">تفاصيل الكتاب</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
