import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAccountConsultationPackage,
  getAccountConsultationPackages,
  rescheduleAccountConsultationSlot,
} from '../services/account-consultations-api.service';
import { accountConsultationKeys } from '../query-keys';

export function useAccountConsultationPackages(options: { page?: number; perPage?: number; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: accountConsultationKeys.packages(options.page, options.perPage),
    queryFn: () => getAccountConsultationPackages({ page: options.page, perPage: options.perPage }),
    enabled: options.enabled ?? true,
  });
}

export function useAccountConsultationPackage(orderId: string, enabled = true) {
  return useQuery({
    queryKey: accountConsultationKeys.package(orderId),
    queryFn: () => getAccountConsultationPackage(orderId),
    enabled: Boolean(orderId) && enabled,
  });
}

export function useRescheduleAccountConsultationSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rescheduleAccountConsultationSlot,
    meta: { successMessage: 'Consultation slot rescheduled.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountConsultationKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['care-portal'] });
    },
  });
}
