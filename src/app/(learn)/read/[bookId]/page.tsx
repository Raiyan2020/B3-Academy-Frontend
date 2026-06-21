'use client';

import { BookReader } from '@/features/books/components/book-reader';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <RequireAuth>
      <BookReader />
    </RequireAuth>
  );
}
