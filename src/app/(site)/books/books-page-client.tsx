'use client';

import { SitePage } from '../../client-page';
import { BookCatalog } from '@/features/books/components/book-catalog';

export function BooksPageClient() {
  return (
    <SitePage>
      <BookCatalog />
    </SitePage>
  );
}
