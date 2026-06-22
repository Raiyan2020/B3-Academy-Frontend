import type { AccessLevel, ContentStatus } from '@/features/business/status.types';
import { MOCK_MONOGRAPHS } from '../data/monographs.mock';
import type { LocalizedString, Monograph } from '../../../../types';

export interface MonographMetadata {
  status: ContentStatus;
  accessLevel: AccessLevel;
  displayOrder: number;
  publishedAt: string;
}

const MONOGRAPH_CONFIG: Record<string, MonographMetadata> = Object.fromEntries(
  MOCK_MONOGRAPHS.map((item, index) => [
    item.id,
    {
      status: (item.id === '4' ? 'inactive' : 'active') as ContentStatus,
      accessLevel: 'subscriber' as const,
      displayOrder: index + 1,
      publishedAt: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
    },
  ]),
);

export type MonographRecord = Monograph & { metadata: MonographMetadata };

function withMetadata(monograph: Monograph): MonographRecord {
  return {
    ...monograph,
    metadata: MONOGRAPH_CONFIG[monograph.id] ?? {
      status: 'active',
      accessLevel: 'subscriber',
      displayOrder: 0,
      publishedAt: new Date().toISOString(),
    },
  };
}

export function getMonographCategories(): LocalizedString[] {
  const seen = new Set<string>();
  return MOCK_MONOGRAPHS.reduce<LocalizedString[]>((categories, item) => {
    const key = item.category.en;
    if (seen.has(key)) return categories;
    seen.add(key);
    categories.push(item.category);
    return categories;
  }, []);
}

export function getMonographs(filters?: { search?: string; category?: string }) {
  return MOCK_MONOGRAPHS.map(withMetadata)
    .filter((item) => item.metadata.status === 'active')
    .filter((item) => {
      if (filters?.category && filters.category !== 'All' && item.category.en !== filters.category) return false;
      if (filters?.search) {
        const needle = filters.search.toLowerCase();
        return (
          item.name.en.toLowerCase().includes(needle) ||
          item.name.ar.includes(filters.search) ||
          item.scientificName.toLowerCase().includes(needle)
        );
      }
      return true;
    })
    .sort((a, b) => a.metadata.displayOrder - b.metadata.displayOrder);
}

export function getMonographById(id: string | undefined, options?: { includeInactive?: boolean }) {
  if (!id) return undefined;
  const monograph = MOCK_MONOGRAPHS.find((item) => item.id === id);
  if (!monograph) return undefined;
  const record = withMetadata(monograph);
  if (!options?.includeInactive && record.metadata.status !== 'active') return undefined;
  return record;
}

export function canAccessMonograph(isAuthenticated: boolean, isSubscribed: boolean, metadata: MonographMetadata) {
  if (metadata.status !== 'active') return false;
  if (metadata.accessLevel === 'subscriber') return isAuthenticated && isSubscribed;
  if (metadata.accessLevel === 'authenticated') return isAuthenticated;
  return true;
}
