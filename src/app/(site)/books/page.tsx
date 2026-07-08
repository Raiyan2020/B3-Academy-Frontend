import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient, dehydrateOptions } from '@/lib/query/get-query-client';
import { bookKeys } from '@/features/books/query-keys';
import { getApiBooks, getApiFeaturedBooks } from '@/features/books/services/books-api.service';
import { BooksPageClient } from './books-page-client';

export default async function Page() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: [...bookKeys.lists(), 'all'], queryFn: () => getApiBooks() }),
    queryClient.prefetchQuery({ queryKey: bookKeys.featured(4), queryFn: () => getApiFeaturedBooks(4) }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient, dehydrateOptions())}>
      <BooksPageClient />
    </HydrationBoundary>
  );
}
