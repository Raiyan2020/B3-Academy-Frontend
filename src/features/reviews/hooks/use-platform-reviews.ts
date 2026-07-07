'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlatformReviews, submitPlatformReview } from '../services/platform-reviews.service';
import type { SubmitPlatformReviewInput } from '../types';
import { platformReviewKeys } from './platform-reviews.keys';

export function usePlatformReviews() {
  return useQuery({
    queryKey: platformReviewKeys.list(),
    queryFn: getPlatformReviews,
  });
}

export function useSubmitPlatformReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitPlatformReviewInput) => submitPlatformReview(input),
    meta: { successMessage: 'Review submitted for approval.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformReviewKeys.list() });
    },
  });
}

