export const podcastKeys = {
  all: ['podcasts'] as const,
  lists: () => [...podcastKeys.all, 'list'] as const,
  detail: (id: string) => [...podcastKeys.all, 'detail', id] as const,
};
