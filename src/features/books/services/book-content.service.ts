'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { BookContent } from '../types/book.types';
import { BOOK_CONTENT } from '../data/book-content.mock';

const PROGRESS_KEY = 'b3-book-reading-positions';

type ReadingPositions = Record<string, Record<string, number>>;

function readPositions(): ReadingPositions {
  return readLocalStorageJson<ReadingPositions>(PROGRESS_KEY, {});
}

function writePositions(positions: ReadingPositions) {
  writeLocalStorageJson(PROGRESS_KEY, positions);
}

export function getBookContent(bookId: string): BookContent | undefined {
  return BOOK_CONTENT[bookId];
}

export function getBookTotalPages(bookId: string): number {
  const content = getBookContent(bookId);
  if (!content) return 0;
  return content.chapters.reduce((total, chapter) => total + chapter.pages.length, 0);
}

export function getReadingPosition(userId: string, bookId: string): number {
  return readPositions()[userId]?.[bookId] ?? 1;
}

export function saveReadingPosition(userId: string, bookId: string, pageNum: number) {
  const positions = readPositions();
  writePositions({
    ...positions,
    [userId]: {
      ...(positions[userId] ?? {}),
      [bookId]: pageNum,
    },
  });
}
