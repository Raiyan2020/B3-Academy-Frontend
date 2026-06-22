import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient, dehydrateOptions } from '@/lib/query/get-query-client';
import { bookKeys } from '@/features/books/query-keys';
import { getBooks, getFeaturedBooks } from '@/features/books/services/books.service';
import { BooksPageClient } from './books-page-client';

export default async function Page() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: bookKeys.lists(), queryFn: getBooks }),
    queryClient.prefetchQuery({ queryKey: bookKeys.featured(4), queryFn: () => getFeaturedBooks(4) }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient, dehydrateOptions())}>
      <BooksPageClient />
    </HydrationBoundary>
  );
}
