'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguage } from '../../../../LanguageContext';
import { ShareButton } from '@/components/actions/share-button';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { useApiBookDetail } from '../hooks/use-books-api';
import type { BookPurchaseFormat } from '../types/book-purchase.types';

const FORMAT_LABELS: Record<BookPurchaseFormat, { en: string; ar: string }> = {
  ebook: { en: 'E-book', ar: 'نسخة إلكترونية' },
  physical: { en: 'Printed copy', ar: 'نسخة مطبوعة' },
  bundle: { en: 'E-book + printed copy', ar: 'النسختان معا' },
};

export function BookDetailView() {
  const { bookId } = useParams<{ bookId: string }>();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const bookQuery = useApiBookDetail(bookId);
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
          <img src={book.coverImage} alt={book.title} className="mx-auto w-56 rounded-md shadow-lg" />
          <div className="mt-6 flex items-center gap-3">
            <ShareButton title={book.title} />
            <FavoriteButton favorite={{ itemId: book.id, kind: 'book', title: book.title, href: `/books/${book.id}`, isAvailable: true }} className="rounded-md border border-slate-300 p-2 text-slate-700" />
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
            <h2 className="text-xl font-bold text-slate-950">{isAr ? 'اختيار صيغة الشراء' : 'Choose purchase format'}</h2>
            <div className="mt-5 grid gap-3">
              {formats.map((format) => {
                const owned = book.ownership[format];
                return (
                  <div key={format} className="rounded-md border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-950">{isAr ? FORMAT_LABELS[format].ar : FORMAT_LABELS[format].en}</p>
                        {owned && <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{isAr ? 'مملوك' : 'Owned'}</span>}
                      </div>
                      <p className="font-bold text-emerald-700">{book.prices[format]}</p>
                    </div>
                    {owned ? (
                      <button disabled className="mt-3 rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">{isAr ? 'مملوك' : 'Owned'}</button>
                    ) : (
                      <Link href={`/checkout/book/${book.id}/${format}`} className="mt-3 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{isAr ? 'شراء' : 'Buy'}</Link>
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
                    <p className="mt-2 text-sm text-emerald-700">{item.prices.ebook || item.prices.physical || item.prices.bundle}</p>
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
