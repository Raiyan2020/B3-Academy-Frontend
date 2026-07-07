export interface PlatformReviewApiItem {
  id: number;
  stars: number;
  review: string;
  status?: { key?: string; label?: string; value?: string } | null;
  user?: { name?: string | null; image?: string | null } | null;
  created_at?: string | null;
}

export interface PlatformReview {
  id: string;
  stars: number;
  review: string;
  userName: string;
  userImage?: string | null;
  createdAt?: string | null;
}

export interface SubmitPlatformReviewInput {
  stars: number;
  review: string;
}

