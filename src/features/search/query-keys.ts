export const searchKeys = {
  all: ['search'] as const,
  query: (term: string, perGroup?: number) => [...searchKeys.all, term, perGroup ?? 5] as const,
};
