'use client';

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
import type { CheckoutBookInput } from '../types/api.types';
import { bookKeys } from '../query-keys';

export function useApiBooks(search?: string) {
  return useQuery({
    queryKey: [...bookKeys.lists(), search || 'all'],
    queryFn: () => getApiBooks({ search }),
  });
}

export function useApiFeaturedBooks(limit = 4) {
  return useQuery({
    queryKey: bookKeys.featured(limit),
    queryFn: () => getApiFeaturedBooks(limit),
  });
}

export function useApiBookDetail(id: string) {
  return useQuery({
    queryKey: bookKeys.detail(id),
    queryFn: () => getApiBookDetail(id),
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
    meta: { successMessage: 'Checkout request created.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...bookKeys.all, 'mine'] });
      void queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}
