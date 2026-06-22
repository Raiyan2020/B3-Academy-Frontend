'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import {
  getBookFormatAvailability,
  getBookCategoryLabel,
  getBookPriceInCurrency,
} from '@/features/books/services/books.service';
import { ownsAnyBookFormat } from '@/features/account/services/ownership.service';
import type { BookPurchaseFormat } from '@/features/books/types/book-purchase.types';
import type { Book } from '../types/book.types';
import { useBooksQuery, useFeaturedBooksQuery } from '../hooks/use-books-query';
import { StaggerItem, StaggerList } from '@/lib/motion/stagger-list';

type SortOrder = 'newest' | 'oldest';
type FormatFilter = 'all' | BookPurchaseFormat;

const FORMAT_BADGE_LABELS: Record<BookPurchaseFormat, { en: string; ar: string }> = {
  ebook: { en: 'E-book', ar: 'إلكتروني' },
  physical: { en: 'Print', ar: 'مطبوع' },
  bundle: { en: 'Bundle', ar: 'حزمة' },
};

export function BookCatalog() {
  const { localize, language } = useLanguage();
  const { formatPrice, currency } = useCurrency();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<SortOrder>('newest');
  const { data: books = [] } = useBooksQuery();
  const { data: featured = [] } = useFeaturedBooksQuery();

  const topics = useMemo(() => Array.from(new Set(books.flatMap((book) => book.topics.map((item) => item.en)))), [books]);

  const filtered = useMemo(() => {
    return books
      .filter((book) => {
        const formats = getBookFormatAvailability(book.id);
        const ebookPrice = getBookPriceInCurrency(book, 'ebook', currency) ?? 0;
        const matchesSearch =
          localize(book.title).toLowerCase().includes(query.toLowerCase()) ||
          localize(book.author).toLowerCase().includes(query.toLowerCase()) ||
          localize(book.description).toLowerCase().includes(query.toLowerCase());
        const matchesTopic = topic === 'all' || book.topics.some((item) => item.en === topic);
        const matchesMinPrice = !minPrice || ebookPrice >= Number(minPrice);
        const matchesMaxPrice = !maxPrice || ebookPrice <= Number(maxPrice);
        const matchesFormat =
          formatFilter === 'all' ||
          (formatFilter === 'ebook' && formats.ebook) ||
          (formatFilter === 'physical' && formats.physical) ||
          (formatFilter === 'bundle' && formats.bundle);
        return matchesSearch && matchesTopic && matchesMinPrice && matchesMaxPrice && matchesFormat;
      })
      .sort((a, b) => (sort === 'newest' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)));
  }, [books, currency, formatFilter, localize, maxPrice, minPrice, query, sort, topic]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{language === 'ar' ? 'الكتب' : 'Books'}</p>
          <h1 className="text-4xl font-bold text-slate-950">{language === 'ar' ? 'الكتب المتاحة' : 'Available books'}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {language === 'ar'
              ? 'يمكن شراء نسخة إلكترونية أو مطبوعة أو الصيغتين معاً حسب توفر كل كتاب. النسخة الإلكترونية تقرأ داخل المنصة فقط.'
              : 'Buy ebook, printed copy, or both depending on availability. Ebooks are read inside the platform only.'}
          </p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-bold text-slate-950">{language === 'ar' ? 'كتب مختارة' : 'Featured books'}</h2>
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((book) => (
              <StaggerItem key={book.id}>
                <BookCard
                book={book}
                title={localize(book.title)}
                author={localize(book.author)}
                description={localize(book.description)}
                category={getBookCategoryLabel(book, language as 'en' | 'ar')}
                owned={Boolean(user && ownsAnyBookFormat(user.id, book.id))}
                formatPrice={formatPrice}
                language={language}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setTopic('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${topic === 'all' ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}
          >
            {language === 'ar' ? 'الكل' : 'All'}
          </button>
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${topic === t ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5">
          <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 md:col-span-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={language === 'ar' ? 'بحث بعنوان الكتاب أو المؤلف' : 'Search title or author'} className="w-full outline-none text-sm" />
          </div>
          <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value as FormatFilter)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="all">{language === 'ar' ? 'كل الصيغ' : 'All formats'}</option>
            <option value="ebook">{language === 'ar' ? 'إلكتروني' : 'E-book'}</option>
            <option value="physical">{language === 'ar' ? 'مطبوع' : 'Print'}</option>
            <option value="bundle">{language === 'ar' ? 'حزمة' : 'Bundle'}</option>
          </select>
          <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={language === 'ar' ? `السعر من (${currency})` : `Min price (${currency})`} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={language === 'ar' ? `السعر إلى (${currency})` : `Max price (${currency})`} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div className="mb-4 flex justify-end">
          <select value={sort} onChange={(e) => setSort(e.target.value as SortOrder)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="newest">{language === 'ar' ? 'الأحدث أولاً' : 'Newest first'}</option>
            <option value="oldest">{language === 'ar' ? 'الأقدم أولاً' : 'Oldest first'}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
            {language === 'ar' ? 'لا توجد كتب مطابقة.' : 'No matching books.'}
          </div>
        ) : (
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((book) => (
              <StaggerItem key={book.id}>
                <BookCard
                  book={book}
                  title={localize(book.title)}
                  author={localize(book.author)}
                  description={localize(book.description)}
                  category={getBookCategoryLabel(book, language as 'en' | 'ar')}
                  owned={Boolean(user && ownsAnyBookFormat(user.id, book.id))}
                  formatPrice={formatPrice}
                  language={language}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>
    </main>
  );
}

function BookCard({
  book,
  title,
  author,
  description,
  category,
  owned,
  formatPrice,
  language,
}: {
  book: Book;
  title: string;
  author: string;
  description: string;
  category: string;
  owned: boolean;
  formatPrice: (price: number) => string;
  language: string;
}) {
  const formats = getBookFormatAvailability(book.id);
  const isAr = language === 'ar';

  return (
    <Link href={`/books/${book.id}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <img src={book.coverImage} alt={title} className="aspect-[3/4] w-full object-cover" />
      <div className="p-4">
        {category && (
          <span className="mb-2 inline-block rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">{category}</span>
        )}
        <h3 className="line-clamp-2 font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{author}</p>
        <p className="mt-2 line-clamp-2 text-xs text-slate-600">{description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {(['ebook', 'physical', 'bundle'] as const)
            .filter((format) => formats[format])
            .map((format) => (
              <span key={format} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                {isAr ? FORMAT_BADGE_LABELS[format].ar : FORMAT_BADGE_LABELS[format].en}
              </span>
            ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
            {owned ? (isAr ? 'مملوك' : 'Owned') : (isAr ? 'متاح' : 'Available')}
          </span>
          <span className="font-bold text-emerald-700">{formatPrice(book.prices.ebook)}</span>
        </div>
      </div>
    </Link>
  );
}
