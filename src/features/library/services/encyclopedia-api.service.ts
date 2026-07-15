import { apiFetch } from '@/lib/api/base-fetch';
import type {
  EncyclopediaHerbFilters,
  EncyclopediaHerbItem,
  EncyclopediaItem,
  EncyclopediaNewsItem,
  EncyclopediaTaxonomyOption,
} from '../types/encyclopedia.types';

interface Paginated<T> {
  items?: T[];
  data?: T[];
}

interface Classification {
  id?: number | string;
  name?: string | null;
}

interface BackendNews {
  id: number | string;
  image?: string | null;
  type?: Classification | null;
  title?: string | null;
  description?: string | null;
  medical_warning?: string | null;
  published_at?: string | null;
}

interface BackendHerbal {
  id: number | string;
  image?: string | null;
  title?: string | null;
  scientific_name?: string | null;
  description?: string | null;
  country_of_origin?: string | null;
  properties?: string[] | null;
  family?: Classification | null;
  species?: Classification | null;
  genus?: Classification | null;
  origin?: Classification | null;
}

interface BackendIndex {
  news?: BackendNews[];
  herbal?: BackendHerbal[];
}

const FALLBACK_IMAGE = 'https://raiyansoft.com/wp-content/uploads/2026/04/n1.webp';

function localized(value?: string | null) {
  return { en: value || '', ar: value || '' };
}

function getItems<T>(payload: T[] | Paginated<T>) {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

function mapNews(item: BackendNews): EncyclopediaNewsItem {
  return {
    id: String(item.id),
    kind: 'news',
    status: 'active',
    isEditorPick: false,
    displayOrder: 0,
    // The list resource omits published_at (detail only) — don't fabricate a "now" date.
    publishedAt: item.published_at || '',
    image: item.image || FALLBACK_IMAGE,
    title: localized(item.title),
    summary: localized(item.description),
    fullContent: localized(item.description),
    category: localized(item.type?.name || 'News'),
  };
}

function mapHerbal(item: BackendHerbal): EncyclopediaHerbItem {
  return {
    id: String(item.id),
    kind: 'herb',
    status: 'active',
    isEditorPick: false,
    displayOrder: 0,
    // scientific_name / description / taxonomy are detail-only; the list resource omits them,
    // so these stay empty for list-sourced herbs (the detail page fills them in). Don't
    // fabricate a "Herb" label or a "now" date when the field is absent.
    publishedAt: '',
    image: item.image || FALLBACK_IMAGE,
    title: localized(item.title),
    summary: localized(item.description),
    fullContent: localized(item.description),
    scientificName: item.scientific_name || '',
    category: 'plants',
    tags: item.properties || [],
    family: item.family?.name ? localized(item.family.name) : undefined,
    originCountry: item.origin?.name ? localized(item.origin.name) : item.country_of_origin ? localized(item.country_of_origin) : undefined,
    herbType: item.species?.name ? localized(item.species.name) : localized(''),
  };
}

export async function getApiEncyclopediaIndex(): Promise<EncyclopediaItem[]> {
  const response = await apiFetch<BackendIndex>('/api/user/encyclopedia');
  return [
    ...(response.news || []).map(mapNews),
    ...(response.herbal || []).map(mapHerbal),
  ];
}

export interface EncyclopediaNewsQuery {
  search?: string;
  newsTypeId?: number;
}

export interface EncyclopediaHerbalQuery {
  search?: string;
  familyId?: number;
  speciesId?: number;
  genusId?: number;
  originId?: number;
}

/**
 * Laravel expects a `filters[...]` query bag (not flat params). `apiFetch`'s
 * `appendQuery` calls `searchParams.set(key, value)`, so literal bracketed key
 * strings serialize correctly (brackets become %5B/%5D, decoded by Laravel).
 */
export async function getApiEncyclopediaNews(query: EncyclopediaNewsQuery = {}) {
  const response = await apiFetch<BackendNews[] | Paginated<BackendNews>>('/api/user/encyclopedia/news', {
    query: {
      'filters[search]': query.search || undefined,
      'filters[encyclopedia_news_type_id]': query.newsTypeId,
      per_page: 50,
    },
  });
  return getItems(response).map(mapNews);
}

export async function getApiHerbalLibrary(query: EncyclopediaHerbalQuery = {}) {
  const response = await apiFetch<BackendHerbal[] | Paginated<BackendHerbal>>('/api/user/encyclopedia/herbal', {
    query: {
      'filters[search]': query.search || undefined,
      'filters[family_id]': query.familyId,
      'filters[species_id]': query.speciesId,
      'filters[genus_id]': query.genusId,
      'filters[origin_id]': query.originId,
      per_page: 50,
    },
  });
  return getItems(response).map(mapHerbal);
}

export async function getApiEncyclopediaItems(
  filters: EncyclopediaHerbFilters = {},
): Promise<EncyclopediaItem[]> {
  const [news, herbs] = await Promise.all([
    getApiEncyclopediaNews({ search: filters.search }),
    getApiHerbalLibrary({
      search: filters.search,
      familyId: filters.familyId,
      speciesId: filters.speciesId,
      genusId: filters.genusId,
      originId: filters.originId,
    }),
  ]);
  return [...news, ...herbs];
}

function mapTaxonomyOption(item: { id?: number | string; name?: string | null }): EncyclopediaTaxonomyOption {
  return { id: Number(item?.id ?? 0), name: item?.name || '' };
}

function getTaxonomyItems(payload: unknown): EncyclopediaTaxonomyOption[] {
  const raw = Array.isArray(payload)
    ? payload
    : ((payload as Paginated<Classification>)?.items ?? (payload as Paginated<Classification>)?.data ?? []);
  return (raw as Classification[]).map(mapTaxonomyOption).filter((option) => option.id > 0);
}

export async function getEncyclopediaNewsTypes(): Promise<EncyclopediaTaxonomyOption[]> {
  const response = await apiFetch<unknown>('/api/user/encyclopedia/news-types');
  return getTaxonomyItems(response);
}

export async function getHerbalFamilies(): Promise<EncyclopediaTaxonomyOption[]> {
  const response = await apiFetch<unknown>('/api/user/encyclopedia/herbal/families');
  return getTaxonomyItems(response);
}

export async function getHerbalSpecies(): Promise<EncyclopediaTaxonomyOption[]> {
  const response = await apiFetch<unknown>('/api/user/encyclopedia/herbal/species');
  return getTaxonomyItems(response);
}

export async function getHerbalGenera(): Promise<EncyclopediaTaxonomyOption[]> {
  const response = await apiFetch<unknown>('/api/user/encyclopedia/herbal/genera');
  return getTaxonomyItems(response);
}

export async function getHerbalOrigins(): Promise<EncyclopediaTaxonomyOption[]> {
  const response = await apiFetch<unknown>('/api/user/encyclopedia/herbal/origins');
  return getTaxonomyItems(response);
}

export async function getApiEncyclopediaDetail(id: string): Promise<EncyclopediaItem> {
  try {
    const news = await apiFetch<BackendNews>(`/api/user/encyclopedia/news/${id}`);
    return mapNews(news);
  } catch {
    const herbal = await apiFetch<BackendHerbal>(`/api/user/encyclopedia/herbal/${id}`);
    return mapHerbal(herbal);
  }
}
