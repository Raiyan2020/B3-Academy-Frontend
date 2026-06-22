export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  featured: (limit?: number) => [...courseKeys.all, 'featured', limit ?? 3] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
};
