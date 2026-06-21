import { readLocalStorageJson, STORAGE_KEYS, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import { DEFAULT_REVIEWS } from '../data/reviews.mock';

export type StoredReview = (typeof DEFAULT_REVIEWS)[number];

export function getStoredReviews() {
  return readLocalStorageJson<StoredReview[]>(STORAGE_KEYS.reviews, DEFAULT_REVIEWS);
}

export function saveStoredReviews(reviews: StoredReview[]) {
  writeLocalStorageJson(STORAGE_KEYS.reviews, reviews);
}
