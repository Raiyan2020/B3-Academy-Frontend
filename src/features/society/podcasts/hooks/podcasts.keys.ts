export const podcastKeys = {
  all: ['society', 'podcasts'] as const,
  list: (filters?: unknown) => [...podcastKeys.all, 'list', filters] as const,
  detail: (id: string) => [...podcastKeys.all, 'detail', id] as const,
};
