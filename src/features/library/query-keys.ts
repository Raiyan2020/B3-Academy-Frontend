export const libraryKeys = {
  all: ['library'] as const,
  encyclopedia: () => [...libraryKeys.all, 'encyclopedia'] as const,
  monographs: () => [...libraryKeys.all, 'monographs'] as const,
  detail: (kind: string, id: string) => [...libraryKeys.all, kind, id] as const,
  taxonomy: (dimension: string) => [...libraryKeys.all, 'encyclopedia', 'taxonomy', dimension] as const,
};
