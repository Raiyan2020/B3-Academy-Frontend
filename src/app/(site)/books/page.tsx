'use client';

import { SitePage } from '../../client-page';
import { BookCatalog } from '@/features/books/components/book-catalog';

export default function Page() {
  return (
    <SitePage>
      <BookCatalog />
    </SitePage>
  );
}
