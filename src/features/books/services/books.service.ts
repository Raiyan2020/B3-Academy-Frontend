import type { Book } from '../types/book.types';
import { MOCK_BOOKS } from '../data/books.mock';

export function getBooks() {
  return MOCK_BOOKS;
}

export function getBookById(id: string | undefined) {
  if (!id) return undefined;
  return MOCK_BOOKS.find((book) => book.id === id);
}

export function getFeaturedBooks(limit = 4) {
  return MOCK_BOOKS.slice(0, limit);
}

export function getRelatedBooks(book: Book, limit = 3) {
  return MOCK_BOOKS.filter((candidate) => candidate.id !== book.id).slice(0, limit);
}
