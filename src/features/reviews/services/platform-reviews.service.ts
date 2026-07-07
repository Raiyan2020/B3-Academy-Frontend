import { apiFetch } from '@/lib/api/base-fetch';
import type { PlatformReview, PlatformReviewApiItem, SubmitPlatformReviewInput } from '../types';

interface PaginatedReviews {
  items?: PlatformReviewApiItem[];
  data?: PlatformReviewApiItem[];
}

function getItems(payload: PlatformReviewApiItem[] | PaginatedReviews): PlatformReviewApiItem[] {
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || [];
}

function mapReview(item: PlatformReviewApiItem): PlatformReview {
  return {
    id: String(item.id),
    stars: item.stars,
    review: item.review,
    userName: item.user?.name || 'Verified customer',
    userImage: item.user?.image,
    createdAt: item.created_at,
  };
}

export async function getPlatformReviews() {
  const response = await apiFetch<PlatformReviewApiItem[] | PaginatedReviews>('/api/user/platform-reviews');
  return getItems(response).map(mapReview);
}

export async function submitPlatformReview(input: SubmitPlatformReviewInput) {
  return apiFetch<void>('/api/user/platform-reviews', {
    method: 'POST',
    body: input,
  });
}

