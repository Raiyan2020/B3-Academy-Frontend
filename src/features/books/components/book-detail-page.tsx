'use client';

import { Share2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { AuthActionGate } from '@/features/access/components/auth-action-gate';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import { getBookById, getRelatedBooks } from '@/features/books/services/books.service';

type BookFormat = 'ebook' | 'physical' | 'bundle';

export function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const { localize, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const book = getBookById(bookId);

  if (!book) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{language === 'ar' ? 'الكتاب غير متاح.' : 'Book is unavailable.'}</div>;
  }

  const owned = Boolean(user?.purchasedBookIds.includes(book.id));
  const related = getRelatedBooks(book, 3);
  const formats: Array<{ id: BookFormat; label: string; price: number; disabled: boolean; reason?: string }> = [
    { id: 'ebook', label: language === 'ar' ? 'نسخة إلكترونية' : 'E-book', price: book.prices.ebook, disabled: owned, reason: owned ? (language === 'ar' ? 'تمتلك النسخة الإلكترونية بالفعل' : 'Ebook already owned') : undefined },
    { id: 'physical', label: language === 'ar' ? 'نسخة مطبوعة' : 'Printed copy', price: book.prices.physical, disabled: false },
    { id: 'bundle', label: language === 'ar' ? 'النسختان معاً' : 'E-book + printed copy', price: book.prices.bundle, disabled: owned, reason: owned ? (language === 'ar' ? 'لا يمكن شراء النسخة الإلكترونية مرة أخرى' : 'Ebook cannot be purchased twice') : undefined },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
        <aside className="rounded-lg border border-slate-200 bg-white p-6">
          <img src={book.coverImage} alt={localize(book.title)} className="mx-auto w-56 rounded-md shadow-lg" />
          <div className="mt-6 flex items-center gap-3">
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><Share2 className="h-4 w-4" />{language === 'ar' ? 'مشاركة الكتاب' : 'Share book'}</button>
            <FavoriteButton favorite={{ itemId: book.id, kind: 'book', title: localize(book.title), href: `/books/${book.id}`, isAvailable: true }} className="rounded-md border border-slate-300 p-2 text-slate-700" />
          </div>
        </aside>

        <div className="space-y-6">
          <article className="rounded-lg border border-slate-200 bg-white p-6">
            <h1 className="text-4xl font-bold text-slate-950">{localize(book.title)}</h1>
            <p className="mt-2 text-lg text-slate-500">{localize(book.author)}</p>
            <p className="mt-5 leading-8 text-slate-700">{localize(book.description)}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {book.topics.map((topic) => <span key={topic.en} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{localize(topic)}</span>)}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">{language === 'ar' ? 'اختيار صيغة الشراء' : 'Choose purchase format'}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {language === 'ar'
                ? 'النسخة الإلكترونية تقرأ داخل المنصة فقط ولا يمكن تحميلها. النسخة المطبوعة تتطلب عنوان شحن أثناء الدفع.'
                : 'The ebook is read inside the platform only and cannot be downloaded. Printed copies require a shipping address during checkout.'}
            </p>
            <div className="mt-5 grid gap-3">
              {formats.map((format) => (
                <div key={format.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-950">{format.label}</p>
                      {format.reason && <p className="mt-1 text-sm text-amber-700">{format.reason}</p>}
                    </div>
                    <p className="font-bold text-emerald-700">{formatPrice(format.price)}</p>
                  </div>
                  {format.disabled ? (
                    <button disabled className="mt-3 rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">{language === 'ar' ? 'غير متاح' : 'Unavailable'}</button>
                  ) : user ? (
                    <Link href={`/checkout/book/${book.id}/${format.id}`} className="mt-3 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{language === 'ar' ? 'شراء' : 'Buy'}</Link>
                  ) : (
                    <AuthActionGate
                      intent={{
                        type: 'book.checkout',
                        href: `/checkout/book/${book.id}/${format.id}`,
                        label: `${localize(book.title)} - ${format.label}`,
                        itemId: book.id,
                        itemKind: 'book',
                      }}
                    >
                      {({ onClick }) => (
                        <button onClick={onClick} className="mt-3 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                          {language === 'ar' ? 'تسجيل الدخول للشراء' : 'Sign in to buy'}
                        </button>
                      )}
                    </AuthActionGate>
                  )}
                </div>
              ))}
            </div>
            {owned && <Link href={`/read/${book.id}`} className="mt-5 inline-flex rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700">{language === 'ar' ? 'فتح القارئ' : 'Open reader'}</Link>}
          </article>

          {related.length > 0 && (
            <article className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">{language === 'ar' ? 'كتب ذات صلة' : 'Related books'}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {related.map((item) => (
                  <Link key={item.id} href={`/books/${item.id}`} className="rounded-md border border-slate-100 p-3 hover:border-emerald-200">
                    <p className="line-clamp-2 font-semibold text-slate-950">{localize(item.title)}</p>
                    <p className="mt-2 text-sm text-emerald-700">{formatPrice(item.prices.ebook)}</p>
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
