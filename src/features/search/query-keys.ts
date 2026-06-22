export const searchKeys = {
  all: ['search'] as const,
  query: (term: string) => [...searchKeys.all, term] as const,
};
