import type { Book } from '../types/book.types';
import type { BookPurchaseFormat } from '../types/book-purchase.types';
import type { CurrencyCode } from '@/features/business/business.types';
import { convertAmount } from '@/features/business/money';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import { MOCK_BOOKS } from '../data/books.mock';

export interface BookFormatAvailability {
  ebook: boolean;
  physical: boolean;
  bundle: boolean;
}

export interface BookMetadata {
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  publishedAt: string;
  formats: BookFormatAvailability;
}

const BOOK_CONFIG_KEY = 'b3-book-config';
const BOOK_CONTENT_KEY = 'b3-book-content';

function buildDefaultConfig(): Record<string, BookMetadata> {
  return Object.fromEntries(
    MOCK_BOOKS.map((book, index) => [
      book.id,
      {
        isActive: true,
        isFeatured: index < 4,
        displayOrder: index + 1,
        publishedAt: new Date(Date.UTC(2025, 1, index + 1)).toISOString(),
        formats: { ebook: true, physical: true, bundle: true },
      },
    ]),
  );
}

function readBookConfig(): Record<string, BookMetadata> {
  return readLocalStorageJson(BOOK_CONFIG_KEY, buildDefaultConfig());
}

function writeBookConfig(config: Record<string, BookMetadata>) {
  writeLocalStorageJson(BOOK_CONFIG_KEY, config);
}

function readBookContent(): Record<string, Book> {
  return readLocalStorageJson(BOOK_CONTENT_KEY, {});
}

function writeBookContent(content: Record<string, Book>) {
  writeLocalStorageJson(BOOK_CONTENT_KEY, content);
}

function resolveBook(book: Book): Book {
  const stored = readBookContent()[book.id];
  return stored ? { ...book, ...stored, id: book.id } : book;
}

function allBooks(): Book[] {
  const content = readBookContent();
  const ids = new Set([...MOCK_BOOKS.map((book) => book.id), ...Object.keys(content)]);
  return Array.from(ids)
    .map((id) => {
      const base = MOCK_BOOKS.find((book) => book.id === id) ?? content[id];
      return base ? resolveBook(base) : null;
    })
    .filter((book): book is Book => Boolean(book));
}

export function getBooks() {
  const config = readBookConfig();
  return allBooks().filter((book) => config[book.id]?.isActive);
}

export function getBookById(id: string | undefined, options?: { includeInactive?: boolean }) {
  if (!id) return undefined;
  const config = readBookConfig();
  const book = allBooks().find((item) => item.id === id);
  if (!book) return undefined;
  if (!options?.includeInactive && !config[id]?.isActive) return undefined;
  return book;
}

export function getFeaturedBooks(limit = 4) {
  const config = readBookConfig();
  return allBooks()
    .filter((book) => config[book.id]?.isActive && config[book.id]?.isFeatured)
    .sort((a, b) => (config[a.id]?.displayOrder ?? 0) - (config[b.id]?.displayOrder ?? 0))
    .slice(0, limit);
}

export function getRelatedBooks(book: Book, limit = 3) {
  return getBooks()
    .filter(
      (candidate) =>
        candidate.id !== book.id &&
        candidate.topics.some((topic) => book.topics.some((bookTopic) => bookTopic.en === topic.en)),
    )
    .slice(0, limit);
}

export const getBookMetadata = (id: string) => readBookConfig()[id];

export function getBookFormatAvailability(bookId: string): BookFormatAvailability {
  return readBookConfig()[bookId]?.formats ?? { ebook: true, physical: true, bundle: true };
}


export function isFormatAvailable(bookId: string, format: BookPurchaseFormat) {
  const formats = getBookFormatAvailability(bookId);
  return formats[format];
}

export function getAvailableFormats(bookId: string): BookPurchaseFormat[] {
  const formats = getBookFormatAvailability(bookId);
  return (['ebook', 'physical', 'bundle'] as const).filter((format) => formats[format]);
}

export function getBookPrice(book: Book, format: BookPurchaseFormat) {
  if (!isFormatAvailable(book.id, format)) return null;
  return book.prices[format];
}

export function getBookPriceInCurrency(book: Book, format: BookPurchaseFormat, currency: CurrencyCode) {
  const price = getBookPrice(book, format);
  if (price == null) return null;
  return convertAmount(price, 'USD', currency);
}

export function getBookCategoryLabel(book: Book, language: 'en' | 'ar' = 'en') {
  const topic = book.topics[0];
  return topic ? topic[language] : '';
}

export function listAdminBooks() {
  const config = readBookConfig();
  return allBooks()
    .map((book) => ({ book, metadata: config[book.id] }))
    .filter((item): item is { book: Book; metadata: BookMetadata } => Boolean(item.metadata))
    .sort((a, b) => a.metadata.displayOrder - b.metadata.displayOrder);
}

export function getAdminBook(id: string) {
  const book = allBooks().find((item) => item.id === id);
  if (!book) return null;
  return { book, metadata: readBookConfig()[id] };
}

export function saveAdminBook(
  id: string | null,
  input: {
    book: Partial<Pick<Book, 'title' | 'author' | 'description' | 'coverImage' | 'pages' | 'prices'>>;
    metadata: BookMetadata;
  },
) {
  const content = readBookContent();
  const config = readBookConfig();
  const bookId = id ?? `b-${Date.now()}`;

  const base = id
    ? allBooks().find((book) => book.id === id) ?? content[bookId]
    : ({
        id: bookId,
        title: { ar: '', en: '' },
        author: { ar: '', en: '' },
        description: { ar: '', en: '' },
        prices: { ebook: 0, physical: 0, bundle: 0 },
        coverImage: '',
        pages: 0,
        topics: [],
        rating: 0,
        reviews: [],
      } satisfies Book);

  const nextBook: Book = {
    ...base,
    ...input.book,
    id: bookId,
    title: input.book.title ?? base.title,
    author: input.book.author ?? base.author,
    description: input.book.description ?? base.description,
    prices: input.book.prices ?? base.prices,
  };

  content[bookId] = nextBook;
  config[bookId] = input.metadata;
  writeBookContent(content);
  writeBookConfig(config);
  return bookId;
}
