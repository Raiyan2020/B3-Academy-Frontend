'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { getBooks } from '@/features/books/services/books.service';
import { getBookPurchases } from '@/features/books/services/book-purchase.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function MyBooksPage() {
  const { user } = useAuth();
  const purchases = user ? getBookPurchases(user.id) : [];

  return (
    <AccountShell title="كتبي" description="الكتب المشتراة حسب صيغة الشراء، مع قراءة النسخة الإلكترونية داخل المنصة فقط.">
      {purchases.length === 0 ? (
        <EmptyAccountState title="لا توجد كتب مشتراة" description="بعد شراء كتاب إلكتروني أو مطبوع سيظهر هنا." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {purchases.map((purchase) => {
            const book = getBooks().find((b) => b.id === purchase.bookId);
            if (!book) return null;
            return (
              <article key={purchase.id} className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-950">{book.title.ar}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  الصيغة: {purchase.format === 'ebook' ? 'نسخة إلكترونية (Ebook)' : purchase.format === 'physical' ? 'نسخة مطبوعة (Physical)' : 'الحزمة الكاملة (Bundle)'}
                </p>
                {purchase.format !== 'ebook' && (
                  <p className="mt-1 text-sm text-emerald-700 font-bold">
                    حالة الشحن: {purchase.status === 'purchased' ? 'قيد التجهيز' : purchase.status === 'shipped' ? 'تم الشحن' : purchase.status === 'delivered' ? 'تم التوصيل' : 'ملغي'}
                  </p>
                )}
                <div className="mt-4 flex gap-3">
                  {(purchase.format === 'ebook' || purchase.format === 'bundle') && (
                    <Link href={`/read/${book.id}`} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">فتح القارئ</Link>
                  )}
                  <Link href={`/books/${book.id}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">تفاصيل الكتاب</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}

