'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { accountKeys } from '../query-keys';
import { getAccountPayments } from '../services/account-payments-api.service';
import { getStoredApiToken } from '@/features/auth/services/auth-api.service';

function hasBackendToken() {
  return Boolean(getStoredApiToken());
}

export interface UseAccountPaymentsOptions {
  page?: number;
  perPage?: number;
}

export function useAccountPayments({ page = 1, perPage = 15 }: UseAccountPaymentsOptions = {}) {
  return useQuery({
    queryKey: accountKeys.payments(page),
    queryFn: () => getAccountPayments({ page, perPage }),
    enabled: hasBackendToken(),
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
