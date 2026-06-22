export const bookKeys = {
  all: ['books'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  featured: (limit?: number) => [...bookKeys.all, 'featured', limit ?? 4] as const,
  detail: (id: string) => [...bookKeys.all, 'detail', id] as const,
};
