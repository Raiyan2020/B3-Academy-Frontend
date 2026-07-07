export const cooperationKeys = {
  all: ['society', 'cooperation'] as const,
  types: () => [...cooperationKeys.all, 'types'] as const,
};
