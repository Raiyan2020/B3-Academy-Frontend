'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/LanguageContext';
import { ShareButton } from '@/components/actions/share-button';
import { AuthActionGate } from '@/features/access/components/auth-action-gate';
import { useAuth } from '@/features/auth/auth-provider';
import { FavoriteToggleButton } from '@/features/favorites/components/favorite-toggle-button';
import { useApiBookDetail } from '../hooks/use-books-api';
import { BOOK_BASE_CURRENCY, BOOK_CURRENCIES, formatBookPrice } from '../services/books-api.service';
import type { BookPurchaseFormat } from '../types/book-purchase.types';
import { imageOrLogo } from '@/lib/images';

const FORMAT_LABELS: Record<BookPurchaseFormat, { en: string; ar: string }> = {
  ebook: { en: 'E-book', ar: 'نسخة إلكترونية' },
  physical: { en: 'Printed copy', ar: 'نسخة مطبوعة' },
  bundle: { en: 'E-book + printed copy', ar: 'النسختان معا' },
};

export function BookDetailView() {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [currency, setCurrency] = useState<string>(BOOK_BASE_CURRENCY);
  const bookQuery = useApiBookDetail(bookId, currency);
  const book = bookQuery.data;

  if (bookQuery.isLoading) {
    return <main className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{isAr ? 'جاري تحميل الكتاب...' : 'Loading book...'}</main>;
  }

  if (!book) {
    return <main className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{isAr ? 'الكتاب غير متاح.' : 'Book is unavailable.'}</main>;
  }

  const formats = (['ebook', 'physical', 'bundle'] as const).filter((format) => book.availability[format]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
        <aside className="rounded-lg border border-slate-200 bg-white p-6">
          <img src={imageOrLogo(book.coverImage)} alt={book.title} className="mx-auto w-56 rounded-md shadow-lg" />
          <div className="mt-6 flex items-center gap-3">
            <ShareButton title={book.title} />
            <FavoriteToggleButton type="book" id={book.id} initialFavorited={book.isFavorited} href={`/books/${book.id}`} label={book.title} className="rounded-md border border-slate-300 p-2 text-slate-700" />
          </div>
        </aside>

        <div className="space-y-6">
          <article className="rounded-lg border border-slate-200 bg-white p-6">
            {book.category && <p className="mb-2 text-sm font-semibold text-emerald-700">{book.category}</p>}
            <h1 className="text-4xl font-bold text-slate-950">{book.title}</h1>
            <p className="mt-2 text-lg text-slate-500">{book.author}</p>
            <p className="mt-5 leading-8 text-slate-700">{book.description}</p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-950">{isAr ? 'اختيار صيغة الشراء' : 'Choose purchase format'}</h2>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                {isAr ? 'العملة' : 'Currency'}
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  aria-label={isAr ? 'عملة العرض' : 'Display currency'}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                >
                  {BOOK_CURRENCIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-5 grid gap-3">
              {formats.map((format) => {
                const owned = book.ownership[format];
                const checkoutHref = `/checkout/book/${book.id}/${format}`;
                const buyLabel = isAr ? 'شراء' : 'Buy';
                return (
                  <div key={format} className="rounded-md border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-950">{isAr ? FORMAT_LABELS[format].ar : FORMAT_LABELS[format].en}</p>
                        {owned && <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{isAr ? 'مملوك' : 'Owned'}</span>}
                      </div>
                      <p className="font-bold text-emerald-700">{formatBookPrice(book.prices[format], isAr, book.currency)}</p>
                    </div>
                    {owned ? (
                      format === 'physical' ? (
                        <Link href="/dashboard/books" className="mt-3 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">{isAr ? 'عرض في كتبي' : 'View in my books'}</Link>
                      ) : (
                        <Link href={`/read/${book.id}`} className="mt-3 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{isAr ? 'اقرأ الآن' : 'Read now'}</Link>
                      )
                    ) : user ? (
                      <Link href={checkoutHref} className="mt-3 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{buyLabel}</Link>
                    ) : (
                      <AuthActionGate intent={{ type: 'book.checkout', href: checkoutHref, label: book.title, itemId: book.id, itemKind: 'book', format }}>
                        {({ onClick }) => (
                          <button onClick={onClick} className="mt-3 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{buyLabel}</button>
                        )}
                      </AuthActionGate>
                    )}
                  </div>
                );
              })}
            </div>
          </article>

          {book.similarBooks.length > 0 && (
            <article className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">{isAr ? 'كتب ذات صلة' : 'Related books'}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {book.similarBooks.map((item) => (
                  <Link key={item.id} href={`/books/${item.id}`} className="rounded-md border border-slate-100 p-3 hover:border-emerald-200">
                    <p className="line-clamp-2 font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-2 text-sm text-emerald-700">{formatBookPrice(item.prices.ebook || item.prices.physical || item.prices.bundle, isAr, item.currency)}</p>
                  </Link>
                ))}
              </div>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
