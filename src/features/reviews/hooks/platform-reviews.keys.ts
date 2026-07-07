export const platformReviewKeys = {
  all: ['platform-reviews'] as const,
  list: () => [...platformReviewKeys.all, 'list'] as const,
};

