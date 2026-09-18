import { useMutation, useQuery } from '@tanstack/react-query';
import { getCooperationTypes, submitCooperationRequest } from '../services/cooperation.service';
import type { CooperationRequestInput } from '../types';
import { cooperationKeys } from './cooperation.keys';

export function useCooperationTypes() {
  return useQuery({
    queryKey: cooperationKeys.types(),
    queryFn: getCooperationTypes,
  });
}

export function useSubmitCooperationRequest() {
  return useMutation({
    mutationFn: (input: CooperationRequestInput) => submitCooperationRequest(input),
    meta: { successMessage: { ar: 'تم إرسال الطلب بنجاح.', en: 'Request submitted successfully.' } },
  });
}
