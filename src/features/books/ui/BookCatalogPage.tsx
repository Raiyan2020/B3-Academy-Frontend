'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { StaggerItem, StaggerList } from '@/lib/motion/stagger-list';
import { useApiBooks, useApiFeaturedBooks } from '../hooks/use-books-api';
import type { BookPurchaseFormat } from '../types/book-purchase.types';
import { BookCard } from './BookCard';

type SortOrder = 'newest' | 'oldest';
type FormatFilter = 'all' | BookPurchaseFormat;

export function BookCatalogPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const booksQuery = useApiBooks(query);
  const featuredQuery = useApiFeaturedBooks();
  const books = booksQuery.data || [];
  const featured = featuredQuery.data || [];

  const categories = useMemo(() => Array.from(new Set<string>(books.map((book) => book.category).filter(Boolean))), [books]);
  const filtered = useMemo(() => {
    return books
      .filter((book) => (category === 'all' || book.category === category) && (formatFilter === 'all' || book.availability[formatFilter]))
      .sort((a, b) => (sort === 'newest' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)));
  }, [books, category, formatFilter, sort]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{isAr ? 'الكتب' : 'Books'}</p>
          <h1 className="text-4xl font-bold text-slate-950">{isAr ? 'الكتب المتاحة' : 'Available books'}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{isAr ? 'تصفح الكتب المتاحة للشراء حسب الصيغ المتوفرة من النظام.' : 'Browse books available for purchase using the backend catalog.'}</p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-bold text-slate-950">{isAr ? 'كتب مختارة' : 'Featured books'}</h2>
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((book) => <StaggerItem key={book.id}><BookCard book={book} isAr={isAr} /></StaggerItem>)}
          </StaggerList>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button onClick={() => setCategory('all')} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === 'all' ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{isAr ? 'الكل' : 'All'}</button>
          {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === item ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item}</button>)}
        </div>

        <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isAr ? 'بحث بالعنوان أو المؤلف' : 'Search title or author'} className="w-full text-sm outline-none" />
          </div>
          <select value={formatFilter} onChange={(event) => setFormatFilter(event.target.value as FormatFilter)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="all">{isAr ? 'كل الصيغ' : 'All formats'}</option>
            <option value="ebook">{isAr ? 'إلكتروني' : 'E-book'}</option>
            <option value="physical">{isAr ? 'مطبوع' : 'Print'}</option>
            <option value="bundle">{isAr ? 'حزمة' : 'Bundle'}</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="newest">{isAr ? 'الأحدث أولا' : 'Newest first'}</option>
            <option value="oldest">{isAr ? 'الأقدم أولا' : 'Oldest first'}</option>
          </select>
        </div>

        {booksQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-600">{isAr ? 'جاري تحميل الكتب...' : 'Loading books...'}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">{isAr ? 'لا توجد كتب مطابقة.' : 'No matching books.'}</div>
        ) : (
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((book) => <StaggerItem key={book.id}><BookCard book={book} isAr={isAr} /></StaggerItem>)}
          </StaggerList>
        )}
      </section>
    </main>
  );
}
