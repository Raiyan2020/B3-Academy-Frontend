'use client';

import type { BookPurchaseFormat } from '@/features/books/types/book-purchase.types';
import {
  ownsBundle as ownsBookBundle,
  ownsEbook,
  ownsPhysical,
} from '@/features/books/services/book-purchase.service';
import { isFormatAvailable } from '@/features/books/services/books.service';
import { getCourseEnrollment } from '@/features/learning/services/enrollment.service';

export function ownsCourse(userId: string, courseId: string): boolean {
  const enrollment = getCourseEnrollment(userId, courseId);
  return Boolean(enrollment && enrollment.status !== 'cancelled');
}

export { ownsEbook, ownsPhysical };

export function ownsBundle(userId: string, bookId: string): boolean {
  return ownsBookBundle(userId, bookId);
}

export function ownsAnyBookFormat(userId: string, bookId: string): boolean {
  return ownsEbook(userId, bookId) || ownsPhysical(userId, bookId) || ownsBundle(userId, bookId);
}

export function canPurchaseBookFormat(userId: string, bookId: string, format: BookPurchaseFormat): boolean {
  if (!isFormatAvailable(bookId, format)) return false;
  if (format === 'ebook') return !ownsEbook(userId, bookId);
  if (format === 'physical') return !ownsPhysical(userId, bookId);
  if (format === 'bundle') return !ownsBundle(userId, bookId) && !ownsEbook(userId, bookId);
  return false;
}

export function hasBookReaderAccess(userId: string, bookId: string): boolean {
  return ownsEbook(userId, bookId) || ownsBundle(userId, bookId);
}
