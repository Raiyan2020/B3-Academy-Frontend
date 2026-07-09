import { apiFetch } from '@/lib/api/base-fetch';
import type {
  EncyclopediaHerbItem,
  EncyclopediaItem,
  EncyclopediaNewsItem,
} from '../types/encyclopedia.types';

interface Paginated<T> {
  items?: T[];
  data?: T[];
}

interface Classification {
  id?: number | string;
  name?: string | null;
}

export interface EncyclopediaClassification {
  id: string;
  name: string;
}

export interface HerbalApiFilters {
  search?: string;
  familyId?: string;
  speciesId?: string;
  genusId?: string;
  originId?: string;
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
    publishedAt: item.published_at || new Date().toISOString(),
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
    publishedAt: new Date().toISOString(),
    image: item.image || FALLBACK_IMAGE,
    title: localized(item.title),
    summary: localized(item.description),
    fullContent: localized(item.description),
    scientificName: item.scientific_name || '',
    category: 'plants',
    tags: item.properties || [],
    family: item.family?.name ? localized(item.family.name) : undefined,
    originCountry: item.origin?.name ? localized(item.origin.name) : item.country_of_origin ? localized(item.country_of_origin) : undefined,
    herbType: item.species?.name ? localized(item.species.name) : localized('Herb'),
  };
}

export async function getApiEncyclopediaIndex(): Promise<EncyclopediaItem[]> {
  const response = await apiFetch<BackendIndex>('/api/user/encyclopedia');
  return [
    ...(response.news || []).map(mapNews),
    ...(response.herbal || []).map(mapHerbal),
  ];
}

export async function getApiEncyclopediaNews(search?: string, newsTypeId?: string) {
  const response = await apiFetch<BackendNews[] | Paginated<BackendNews>>('/api/user/encyclopedia/news', {
    query: {
      'filters[search]': search,
      'filters[encyclopedia_news_type_id]': newsTypeId,
      per_page: 50,
    },
  });
  return getItems(response).map(mapNews);
}

export async function getApiHerbalLibrary(filters: HerbalApiFilters = {}) {
  const response = await apiFetch<BackendHerbal[] | Paginated<BackendHerbal>>('/api/user/encyclopedia/herbal', {
    query: {
      'filters[search]': filters.search,
      'filters[family_id]': filters.familyId,
      'filters[species_id]': filters.speciesId,
      'filters[genus_id]': filters.genusId,
      'filters[origin_id]': filters.originId,
      per_page: 50,
    },
  });
  return getItems(response).map(mapHerbal);
}

async function getClassifications(path: string): Promise<EncyclopediaClassification[]> {
  const response = await apiFetch<Classification[] | Paginated<Classification>>(path);
  return getItems(response)
    .filter((item) => item.id !== undefined && item.name)
    .map((item) => ({ id: String(item.id), name: item.name! }));
}

export function getApiNewsTypes() {
  return getClassifications('/api/user/encyclopedia/news-types');
}

export function getApiHerbalFamilies() {
  return getClassifications('/api/user/encyclopedia/herbal/families');
}

export function getApiHerbalSpecies() {
  return getClassifications('/api/user/encyclopedia/herbal/species');
}

export function getApiHerbalGenera() {
  return getClassifications('/api/user/encyclopedia/herbal/genera');
}

export function getApiHerbalOrigins() {
  return getClassifications('/api/user/encyclopedia/herbal/origins');
}

export async function getApiEncyclopediaItems(
  search?: string,
  herbalFilters: HerbalApiFilters = {},
  newsTypeId?: string,
): Promise<EncyclopediaItem[]> {
  const [news, herbs] = await Promise.all([
    getApiEncyclopediaNews(search, newsTypeId),
    getApiHerbalLibrary({ ...herbalFilters, search: herbalFilters.search || search }),
  ]);
  return [...news, ...herbs];
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
