'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { BookPurchase, BookPurchaseFormat } from '../types/book-purchase.types';
import { getBookById } from '@/features/books/services/books.service';
import { addNotification } from '@/features/account/services/account-records.service';

const BOOK_PURCHASES_KEY = 'b3-book-purchases';

export function getAllBookPurchases(): BookPurchase[] {
  return readLocalStorageJson<BookPurchase[]>(BOOK_PURCHASES_KEY, []);
}

export function getBookPurchases(userId: string): BookPurchase[] {
  return getAllBookPurchases().filter((p) => p.userId === userId);
}

export function hasEbookAccess(userId: string, bookId: string): boolean {
  return getAllBookPurchases().some(
    (p) => p.userId === userId && p.bookId === bookId && (p.format === 'ebook' || p.format === 'bundle') && p.status !== 'cancelled'
  );
}

export function addBookPurchase(input: {
  userId: string;
  bookId: string;
  format: BookPurchaseFormat;
  price: number;
  shippingAddress?: string;
  paymentId?: string;
}) {
  const purchase: BookPurchase = {
    id: `book-pur-${Date.now()}`,
    userId: input.userId,
    bookId: input.bookId,
    format: input.format,
    price: input.price,
    shippingAddress: input.shippingAddress,
    status: 'purchased',
    purchasedAt: new Date().toISOString(),
    paymentId: input.paymentId,
  };

  const all = getAllBookPurchases();
  writeLocalStorageJson(BOOK_PURCHASES_KEY, [purchase, ...all]);

  const book = getBookById(input.bookId);
  addNotification({
    userId: input.userId,
    title: 'تم شراء الكتاب',
    body: `تمت إضافة كتاب: ${book ? book.title.ar : input.bookId} (${input.format.toUpperCase()}) إلى حسابك.`,
    href: '/dashboard/books',
  });

  return purchase;
}
