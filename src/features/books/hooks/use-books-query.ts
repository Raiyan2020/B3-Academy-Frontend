'use client';

import { useQuery } from '@tanstack/react-query';
import { getBooks, getFeaturedBooks } from '../services/books.service';
import { bookKeys } from '../query-keys';

export function useBooksQuery() {
  return useQuery({
    queryKey: bookKeys.lists(),
    queryFn: getBooks,
  });
}

export function useFeaturedBooksQuery(limit = 4) {
  return useQuery({
    queryKey: bookKeys.featured(limit),
    queryFn: () => getFeaturedBooks(limit),
  });
}
