'use client';

import Link from 'next/link';
import { AccountShell, EmptyAccountState } from '@/features/account/components/account-shell';
import { useMyBooks } from '../hooks/use-books-api';
import { getMyBookInvoiceUrl } from '../services/books-api.service';
import { downloadAuthenticatedFile } from '@/lib/api/download';
import { toastError } from '@/lib/feedback/toast';

async function handleInvoice(orderId: string) {
  try {
    await downloadAuthenticatedFile(getMyBookInvoiceUrl(orderId), 'invoice.pdf');
  } catch {
    toastError('تعذر تحميل الفاتورة. حاول مرة أخرى.');
  }
}

export function MyBooksPanel() {
  const booksQuery = useMyBooks();
  const books = booksQuery.data || [];

  return (
    <AccountShell title="كتبي" description="الكتب المشتراة من النظام حسب صيغة الشراء وحالة القراءة.">
      {booksQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">جاري تحميل الكتب...</div>
      ) : books.length === 0 ? (
        <EmptyAccountState title="لا توجد كتب مشتراة" description="بعد شراء كتاب إلكتروني أو مطبوع سيظهر هنا." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {books.map((book) => (
            <article key={book.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">{book.title}</h2>
              <p className="mt-2 text-sm text-slate-600">الصيغة: {book.formatLabel || book.format}</p>
              <p className="mt-1 text-sm text-slate-600">السعر: {book.paidAmount} {book.currency}</p>
              {book.paidAt && <p className="mt-1 text-sm text-slate-600">تاريخ الدفع: {book.paidAt}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                {book.readUrl && <a href={book.readUrl} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">فتح القارئ</a>}
                <Link href={`/books/${book.bookId}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">تفاصيل الكتاب</Link>
                <button type="button" onClick={() => handleInvoice(book.id)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">الفاتورة</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
