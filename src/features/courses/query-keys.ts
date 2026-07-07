export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  apiList: (filters?: unknown) => [...courseKeys.all, 'api-list', filters ?? {}] as const,
  featured: (limit?: number) => [...courseKeys.all, 'featured', limit ?? 3] as const,
  apiFeatured: (limit?: number, currency?: string) => [...courseKeys.all, 'api-featured', limit ?? 3, currency ?? 'USD'] as const,
  categories: () => [...courseKeys.all, 'categories'] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
  apiDetail: (id: string, currency?: string) => [...courseKeys.all, 'api-detail', id, currency ?? 'USD'] as const,
  mine: () => [...courseKeys.all, 'mine'] as const,
};
