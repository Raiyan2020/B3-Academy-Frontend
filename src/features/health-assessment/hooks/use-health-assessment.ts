'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getHealthAssessmentForm,
  getHealthAssessmentSubmission,
  getHealthAssessmentSubmissions,
  submitHealthAssessment,
} from '../services/health-assessment-api.service';
import type { HealthAssessmentAnswerInput } from '../types/health-assessment.types';
import { healthAssessmentKeys } from '../query-keys';

export function useHealthAssessmentForm(enabled = true) {
  return useQuery({
    queryKey: healthAssessmentKeys.form(),
    queryFn: getHealthAssessmentForm,
    enabled,
  });
}

export function useHealthAssessmentSubmissions(
  params?: { page?: number; perPage?: number },
  enabled = true,
) {
  const page = params?.page;
  const perPage = params?.perPage;
  return useQuery({
    queryKey: healthAssessmentKeys.list(page, perPage),
    queryFn: () => getHealthAssessmentSubmissions({ page, perPage }),
    enabled,
  });
}

export function useHealthAssessmentSubmission(id: number | string | null | undefined) {
  return useQuery({
    queryKey: healthAssessmentKeys.detail(id ?? ''),
    queryFn: () => getHealthAssessmentSubmission(id as number | string),
    enabled: id !== null && id !== undefined && id !== '',
  });
}

export function useSubmitHealthAssessment(successMessage?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answers: HealthAssessmentAnswerInput[]) => submitHealthAssessment(answers),
    meta: { successMessage: successMessage ?? 'Health assessment submitted.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: healthAssessmentKeys.lists() });
    },
  });
}
