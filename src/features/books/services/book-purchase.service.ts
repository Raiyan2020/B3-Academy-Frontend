'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { CurrencyCode } from '@/features/business/business.types';
import type { BookPurchase, BookPurchaseFormat, PrintOrderRecord } from '../types/book-purchase.types';
import { getBookById } from '@/features/books/services/books.service';
import { addNotification } from '@/features/account/services/account-records.service';

const BOOK_PURCHASES_KEY = 'b3-book-purchases';
const PRINT_ORDERS_KEY = 'b3-print-orders';

export function getAllBookPurchases(): BookPurchase[] {
  return readLocalStorageJson<BookPurchase[]>(BOOK_PURCHASES_KEY, []);
}

export function getBookPurchases(userId: string): BookPurchase[] {
  return getAllBookPurchases().filter((p) => p.userId === userId);
}

export function getPrintOrders(userId?: string): PrintOrderRecord[] {
  const all = readLocalStorageJson<PrintOrderRecord[]>(PRINT_ORDERS_KEY, []);
  return userId ? all.filter((order) => order.userId === userId) : all;
}

function isActivePurchase(purchase: BookPurchase) {
  return purchase.status !== 'cancelled';
}

export function ownsEbook(userId: string, bookId: string): boolean {
  return getAllBookPurchases().some(
    (p) => p.userId === userId && p.bookId === bookId && (p.format === 'ebook' || p.format === 'bundle') && isActivePurchase(p),
  );
}

export function ownsPhysical(userId: string, bookId: string): boolean {
  return getAllBookPurchases().some(
    (p) => p.userId === userId && p.bookId === bookId && (p.format === 'physical' || p.format === 'bundle') && isActivePurchase(p),
  );
}

export function ownsBundle(userId: string, bookId: string): boolean {
  return getAllBookPurchases().some(
    (p) => p.userId === userId && p.bookId === bookId && p.format === 'bundle' && isActivePurchase(p),
  );
}

export function hasEbookAccess(userId: string, bookId: string): boolean {
  return ownsEbook(userId, bookId);
}

function createPrintOrder(input: {
  userId: string;
  bookId: string;
  purchaseId: string;
  format: 'physical' | 'bundle';
  shippingAddressId: string;
  shippingAddressLabel: string;
}) {
  const book = getBookById(input.bookId);
  const order: PrintOrderRecord = {
    id: `print-${Date.now()}`,
    userId: input.userId,
    bookId: input.bookId,
    purchaseId: input.purchaseId,
    bookTitle: book?.title ?? { ar: input.bookId, en: input.bookId },
    format: input.format,
    shippingAddressId: input.shippingAddressId,
    shippingAddressLabel: input.shippingAddressLabel,
    status: 'pending_fulfillment',
    createdAt: new Date().toISOString(),
    adminNotifyPending: true,
  };
  const all = getPrintOrders();
  writeLocalStorageJson(PRINT_ORDERS_KEY, [order, ...all]);
  return order;
}

export function addBookPurchase(input: {
  userId: string;
  bookId: string;
  format: BookPurchaseFormat;
  price: number;
  currency?: CurrencyCode;
  shippingAddressId?: string;
  shippingAddressLabel?: string;
  paymentId?: string;
}) {
  const purchaseId = `book-pur-${Date.now()}`;
  let printOrderId: string | undefined;

  if ((input.format === 'physical' || input.format === 'bundle') && input.shippingAddressId && input.shippingAddressLabel) {
    const printOrder = createPrintOrder({
      userId: input.userId,
      bookId: input.bookId,
      purchaseId,
      format: input.format,
      shippingAddressId: input.shippingAddressId,
      shippingAddressLabel: input.shippingAddressLabel,
    });
    printOrderId = printOrder.id;
  }

  const purchase: BookPurchase = {
    id: purchaseId,
    userId: input.userId,
    bookId: input.bookId,
    format: input.format,
    price: input.price,
    currency: input.currency,
    shippingAddressId: input.shippingAddressId,
    shippingAddressLabel: input.shippingAddressLabel,
    printOrderId,
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
