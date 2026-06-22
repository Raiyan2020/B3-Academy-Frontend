import type { ContentStatus } from '@/features/business/status.types';
import type { CurrencyCode } from '@/features/business/business.types';
import type { BookPurchaseFormat } from './book-purchase.types';

export type { Book } from '../../../../types';

export type BookFormatAvailability = Partial<Record<BookPurchaseFormat, boolean>>;

export interface BookMetadata {
  status: ContentStatus;
  isFeatured: boolean;
  displayOrder: number;
  publishedAt: string;
  categoryIds: string[];
  baseCurrency: CurrencyCode;
  formatAvailability: BookFormatAvailability;
}

export interface BookChapterPage {
  pageNum: number;
  content: { en: string; ar: string };
}

export interface BookChapter {
  title: { en: string; ar: string };
  pages: BookChapterPage[];
}

export interface BookContent {
  bookId: string;
  chapters: BookChapter[];
}
