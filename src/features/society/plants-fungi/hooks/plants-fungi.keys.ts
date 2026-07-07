export const plantsFungiKeys = {
  all: ['society', 'plants-fungi'] as const,
  categories: () => [...plantsFungiKeys.all, 'categories'] as const,
  list: (filters?: unknown) => [...plantsFungiKeys.all, 'list', filters] as const,
  detail: (id: string) => [...plantsFungiKeys.all, 'detail', id] as const,
};
