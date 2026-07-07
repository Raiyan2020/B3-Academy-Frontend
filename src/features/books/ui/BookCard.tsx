'use client';

import Link from 'next/link';
import type { BookListItem } from '../types/api.types';
import type { BookPurchaseFormat } from '../types/book-purchase.types';

const FORMAT_LABELS: Record<BookPurchaseFormat, { en: string; ar: string }> = {
  ebook: { en: 'E-book', ar: 'نسخة إلكترونية' },
  physical: { en: 'Print', ar: 'نسخة مطبوعة' },
  bundle: { en: 'Bundle', ar: 'حزمة' },
};

export function BookCard({ book, isAr }: { book: BookListItem; isAr: boolean }) {
  const formats = (['ebook', 'physical', 'bundle'] as const).filter((format) => book.availability[format]);
  const owned = Object.values(book.ownership).some(Boolean);

  return (
    <Link href={`/books/${book.id}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <img src={book.coverImage} alt={book.title} className="aspect-[3/4] w-full object-cover" />
      <div className="p-4">
        {book.category && <span className="mb-2 inline-block rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">{book.category}</span>}
        <h3 className="line-clamp-2 font-bold text-slate-950">{book.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{book.author}</p>
        <p className="mt-2 line-clamp-2 text-xs text-slate-600">{book.description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {formats.map((format) => (
            <span key={format} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              {isAr ? FORMAT_LABELS[format].ar : FORMAT_LABELS[format].en}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">{owned ? (isAr ? 'مملوك' : 'Owned') : isAr ? 'متاح' : 'Available'}</span>
          <span className="font-bold text-emerald-700">{book.prices.ebook || book.prices.physical || book.prices.bundle}</span>
        </div>
      </div>
    </Link>
  );
}
