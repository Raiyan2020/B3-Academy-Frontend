export const communityKeys = {
  all: ['community'] as const,
  blogs: () => [...communityKeys.all, 'blogs'] as const,
  researches: () => [...communityKeys.all, 'researches'] as const,
  theories: () => [...communityKeys.all, 'theories'] as const,
  detail: (section: string, id: string) => [...communityKeys.all, section, id] as const,
};
