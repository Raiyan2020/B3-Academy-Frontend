import { readLocalStorageJson, STORAGE_KEYS, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

export interface StoredReview {
  id: string;
  name: string;
  rating: number;
  description: string;
  date: string;
  userEmail?: string;
}

export function getStoredReviews() {
  return readLocalStorageJson<StoredReview[]>(STORAGE_KEYS.reviews, []);
}

export function saveStoredReviews(reviews: StoredReview[]) {
  writeLocalStorageJson(STORAGE_KEYS.reviews, reviews);
}
