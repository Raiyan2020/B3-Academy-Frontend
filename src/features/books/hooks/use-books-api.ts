import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkoutBook,
  getApiBookDetail,
  getApiBooks,
  getApiFeaturedBooks,
  getBookCategories,
  getMyBook,
  getMyBooks,
} from '../services/books-api.service';
import type { BookCatalogQuery } from '../services/books-api.service';
import type { CheckoutBookInput } from '../types/api.types';
import { bookKeys } from '../query-keys';

// The currency is part of every books query key: it changes the prices the backend returns, so
// two currencies must not share a cache entry.
export function useApiBooks(query?: BookCatalogQuery) {
  return useQuery({
    queryKey: [...bookKeys.lists(), query ?? 'all'],
    queryFn: () => getApiBooks(query),
  });
}

export function useApiFeaturedBooks(limit = 4, currency?: string) {
  return useQuery({
    queryKey: [...bookKeys.featured(limit), currency ?? 'base'],
    queryFn: () => getApiFeaturedBooks(limit, currency),
  });
}

export function useApiBookDetail(id: string, currency?: string) {
  return useQuery({
    queryKey: [...bookKeys.detail(id), currency ?? 'base'],
    queryFn: () => getApiBookDetail(id, currency),
    enabled: Boolean(id),
  });
}

export function useBookCategories() {
  return useQuery({
    queryKey: [...bookKeys.all, 'categories'],
    queryFn: getBookCategories,
  });
}

export function useMyBooks(enabled = true) {
  return useQuery({
    queryKey: [...bookKeys.all, 'mine'],
    queryFn: getMyBooks,
    enabled,
  });
}

export function useMyBook(orderId: string) {
  return useQuery({
    queryKey: [...bookKeys.all, 'mine', orderId],
    queryFn: () => getMyBook(orderId),
    enabled: Boolean(orderId),
  });
}

export function useCheckoutBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckoutBookInput) => checkoutBook(input),
    meta: { successMessage: { ar: 'تم إنشاء طلب الدفع.', en: 'Checkout request created.' } },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...bookKeys.all, 'mine'] });
      void queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}
