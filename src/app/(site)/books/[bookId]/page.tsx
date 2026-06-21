'use client';

import { SitePage } from '../../../client-page';
import { BookDetailPage } from '@/features/books/components/book-detail-page';

export default function Page() {
  return (
    <SitePage>
      <BookDetailPage />
    </SitePage>
  );
}
