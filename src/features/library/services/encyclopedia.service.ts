import { MOCK_ENTRIES } from '../data/encyclopedia.mock';
import type { ContentStatus } from '@/features/business/status.types';
import type {
  EncyclopediaEditorPick,
  EncyclopediaHerbFilters,
  EncyclopediaHerbItem,
  EncyclopediaItem,
  EncyclopediaNewsItem,
} from '../types/encyclopedia.types';

const ENTRY_CONFIG: Record<
  string,
  {
    kind: 'news' | 'herb';
    status: ContentStatus;
    isEditorPick: boolean;
    displayOrder: number;
    publishedAt: string;
    newsCategory?: { en: string; ar: string };
    herbType?: { en: string; ar: string };
  }
> = {
  'psilocybe-cubensis': {
    kind: 'herb',
    status: 'active',
    isEditorPick: true,
    displayOrder: 1,
    publishedAt: '2025-03-01T00:00:00.000Z',
    herbType: { en: 'Fungi', ar: 'فطر' },
  },
  ashwagandha: {
    kind: 'herb',
    status: 'active',
    isEditorPick: true,
    displayOrder: 2,
    publishedAt: '2025-02-15T00:00:00.000Z',
    herbType: { en: 'Plant', ar: 'نبات' },
  },
  'lion-mane': {
    kind: 'herb',
    status: 'active',
    isEditorPick: true,
    displayOrder: 3,
    publishedAt: '2025-02-01T00:00:00.000Z',
    herbType: { en: 'Fungi', ar: 'فطر' },
  },
  ayahuasca: {
    kind: 'news',
    status: 'active',
    isEditorPick: false,
    displayOrder: 1,
    publishedAt: '2026-01-10T00:00:00.000Z',
    newsCategory: { en: 'Research', ar: 'أبحاث' },
  },
  rhodiola: {
    kind: 'news',
    status: 'active',
    isEditorPick: true,
    displayOrder: 2,
    publishedAt: '2026-01-05T00:00:00.000Z',
    newsCategory: { en: 'Safety', ar: 'السلامة' },
  },
};

const EDITOR_PICKS: EncyclopediaEditorPick[] = [
  { id: 'ep1', entryId: 'psilocybe-cubensis', displayOrder: 1, label: { en: 'Sustainability', ar: 'الاستدامة' } },
  { id: 'ep2', entryId: 'ashwagandha', displayOrder: 2, label: { en: 'Safety', ar: 'السلامة' } },
  { id: 'ep3', entryId: 'lion-mane', displayOrder: 3, label: { en: 'Cognition', ar: 'الإدراك' } },
  { id: 'ep4', entryId: 'rhodiola', displayOrder: 4, label: { en: 'Adaptogens', ar: 'المكيفات' } },
];

function mapEntry(entry: (typeof MOCK_ENTRIES)[number]): EncyclopediaItem | undefined {
  const config = ENTRY_CONFIG[entry.id];
  if (!config) return undefined;

  const base = {
    id: entry.id,
    status: config.status,
    isEditorPick: config.isEditorPick,
    displayOrder: config.displayOrder,
    publishedAt: config.publishedAt,
    image: entry.image,
    title: entry.name,
    summary: entry.description,
    fullContent: entry.fullContent,
  };

  if (config.kind === 'news') {
    return {
      ...base,
      kind: 'news',
      category: config.newsCategory ?? { en: 'News', ar: 'أخبار' },
    } satisfies EncyclopediaNewsItem;
  }

  return {
    ...base,
    kind: 'herb',
    scientificName: entry.scientificName,
    category: entry.category,
    tags: entry.tags,
    family: entry.family,
    originCountry: entry.originCountry,
    sex: entry.sex,
    herbType: config.herbType ?? { en: entry.category, ar: entry.category },
  } satisfies EncyclopediaHerbItem;
}

const ALL_ITEMS = MOCK_ENTRIES.map(mapEntry).filter((item): item is EncyclopediaItem => Boolean(item));

function isActive(item: EncyclopediaItem) {
  return item.status === 'active';
}

function localizeMatch(value: { en: string; ar: string } | undefined, filter: string) {
  if (!value || !filter) return true;
  const needle = filter.toLowerCase();
  return value.en.toLowerCase().includes(needle) || value.ar.includes(filter);
}

export function getEncyclopediaEntries() {
  return ALL_ITEMS.filter(isActive);
}

export function getEntryById(id: string | undefined, options?: { includeInactive?: boolean }) {
  if (!id) return undefined;
  const item = ALL_ITEMS.find((entry) => entry.id === id);
  if (!item) return undefined;
  if (!options?.includeInactive && !isActive(item)) return undefined;
  return item;
}

export function getLatestNews(limit = 3): EncyclopediaNewsItem[] {
  return ALL_ITEMS.filter((item): item is EncyclopediaNewsItem => item.kind === 'news' && isActive(item))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export function searchNews(query: string): EncyclopediaNewsItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return ALL_ITEMS.filter((item): item is EncyclopediaNewsItem => item.kind === 'news' && isActive(item));
  return ALL_ITEMS.filter((item): item is EncyclopediaNewsItem => {
    if (item.kind !== 'news' || !isActive(item)) return false;
    return (
      item.title.en.toLowerCase().includes(needle) ||
      item.title.ar.includes(query.trim()) ||
      item.summary.en.toLowerCase().includes(needle) ||
      item.summary.ar.includes(query.trim()) ||
      item.category.en.toLowerCase().includes(needle) ||
      item.category.ar.includes(query.trim())
    );
  }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getEditorPicks(): EncyclopediaItem[] {
  return EDITOR_PICKS.map((pick) => getEntryById(pick.entryId))
    .filter((item): item is EncyclopediaItem => Boolean(item))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getHerbLibrary(filters: EncyclopediaHerbFilters = {}): EncyclopediaHerbItem[] {
  return ALL_ITEMS.filter((item): item is EncyclopediaHerbItem => item.kind === 'herb' && isActive(item)).filter(
    (herb) => {
      if (filters.search) {
        const needle = filters.search.toLowerCase();
        const matchesSearch =
          herb.title.en.toLowerCase().includes(needle) ||
          herb.title.ar.includes(filters.search) ||
          herb.scientificName.toLowerCase().includes(needle);
        if (!matchesSearch) return false;
      }
      if (filters.type && !localizeMatch(herb.herbType, filters.type)) return false;
      if (filters.family && !localizeMatch(herb.family, filters.family)) return false;
      if (filters.sex && !localizeMatch(herb.sex, filters.sex)) return false;
      if (filters.origin && !localizeMatch(herb.originCountry, filters.origin)) return false;
      return true;
    },
  );
}

export function getHerbFilterOptions(dimension: 'type' | 'family' | 'sex' | 'origin') {
  const herbs = ALL_ITEMS.filter((item): item is EncyclopediaHerbItem => item.kind === 'herb' && isActive(item));
  const values = new Set<string>();
  for (const herb of herbs) {
    const source =
      dimension === 'type'
        ? herb.herbType
        : dimension === 'family'
          ? herb.family
          : dimension === 'sex'
            ? herb.sex
            : herb.originCountry;
    if (source?.en) values.add(source.en);
  }
  return Array.from(values).sort();
}

// Legacy compatibility for components still using EncyclopediaEntry shape
export function getLegacyEntryById(id: string | undefined) {
  if (!id) return undefined;
  return MOCK_ENTRIES.find((entry) => entry.id === id);
}

export function getLegacyEncyclopediaEntries() {
  const activeIds = new Set(getEncyclopediaEntries().map((item) => item.id));
  return MOCK_ENTRIES.filter((entry) => activeIds.has(entry.id));
}

export function listAdminEncyclopediaNews() {
  return ALL_ITEMS.filter((item): item is EncyclopediaNewsItem => item.kind === 'news').sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
}

export function listAdminHerbs() {
  return ALL_ITEMS.filter((item): item is EncyclopediaHerbItem => item.kind === 'herb').sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
}

export function saveAdminHerb(
  id: string,
  input: { summary: EncyclopediaHerbItem['summary']; status: EncyclopediaHerbItem['status']; isEditorPick: boolean },
) {
  const config = ENTRY_CONFIG[id];
  if (!config || config.kind !== 'herb') return false;
  config.status = input.status === 'inactive' ? 'inactive' : 'active';
  config.isEditorPick = input.isEditorPick;
  const entry = MOCK_ENTRIES.find((item) => item.id === id);
  if (entry) entry.description = input.summary;
  return true;
}

export function upsertAdminEncyclopediaNews(item: EncyclopediaNewsItem) {
  const config = ENTRY_CONFIG[item.id];
  if (!config || config.kind !== 'news') return false;
  config.status = item.status === 'inactive' ? 'inactive' : 'active';
  config.displayOrder = item.displayOrder;
  config.isEditorPick = item.isEditorPick;
  config.newsCategory = item.category;
  const entry = MOCK_ENTRIES.find((mock) => mock.id === item.id);
  if (entry) {
    entry.name = item.title;
    entry.description = item.summary;
    entry.fullContent = item.fullContent;
    entry.image = item.image;
  }
  return true;
}

export type { EncyclopediaNewsItem };
