import { apiFetch } from '@/lib/api/base-fetch';
import { ApiError } from '@/lib/api/api-error';
import { LOGO_IMAGE } from '@/lib/images';
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
  is_favorited?: boolean;
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
  is_favorited?: boolean;
}

/** Community article/theory post, the source the spec names for editor picks. */
interface BackendCommunityPost {
  id: number | string;
  image?: string | null;
  title?: string | null;
  short_description?: string | null;
  type?: string | null;
  type_label?: string | null;
  published_at?: string | null;
}

interface BackendIndex {
  news?: BackendNews[];
  editor_picks?: BackendCommunityPost[];
  news_editor_picks?: BackendNews[];
  herbal?: BackendHerbal[];
}

const FALLBACK_IMAGE = LOGO_IMAGE;

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
    isFavorited: Boolean(item.is_favorited),
  };
}

/** Community post → encyclopedia card. Its detail page lives under the community routes. */
function mapCommunityPost(item: BackendCommunityPost): EncyclopediaNewsItem {
  return {
    id: String(item.id),
    kind: 'news',
    status: 'active',
    isEditorPick: true,
    displayOrder: 0,
    publishedAt: item.published_at || new Date().toISOString(),
    image: item.image || FALLBACK_IMAGE,
    title: localized(item.title),
    summary: localized(item.short_description),
    fullContent: localized(item.short_description),
    category: localized(item.type_label || item.type || 'Article'),
    isFavorited: false,
    communityPostType: item.type === 'theory' ? 'theory' : 'article',
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
    // All four classifications the spec lists. `genus` was eager-loaded and filterable but
    // dropped here, so only three of the four ever reached the detail page.
    genus: item.genus?.name ? localized(item.genus.name) : undefined,
    herbType: item.species?.name ? localized(item.species.name) : localized('Herb'),
    isFavorited: Boolean(item.is_favorited),
  };
}

export async function getApiEncyclopediaIndex(): Promise<EncyclopediaItem[]> {
  const response = await apiFetch<BackendIndex>('/api/user/encyclopedia');
  return [
    ...(response.news || []).map(mapNews),
    ...(response.herbal || []).map(mapHerbal),
  ];
}

/**
 * Editor picks (مختارات المحرر). The spec defines these as items the admin promotes from the
 * community's المقالات and النظريات sections — that is the `editor_picks` payload. The page used
 * to read `news_editor_picks` instead, a different table entirely, so community content could
 * never actually be promoted into the encyclopedia the way the spec describes.
 *
 * `news_editor_picks` is still accepted as a fallback so an install that has only ever curated
 * news entries does not lose its section on deploy.
 */
export async function getApiEncyclopediaEditorPicks(): Promise<EncyclopediaNewsItem[]> {
  const response = await apiFetch<BackendIndex>('/api/user/encyclopedia');
  const communityPicks = (response.editor_picks || []).map(mapCommunityPost);
  if (communityPicks.length > 0) return communityPicks;
  return (response.news_editor_picks || []).map((item) => ({ ...mapNews(item), isEditorPick: true }));
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

/**
 * News and herbal entries live in separate tables, so their ids overlap and one
 * `/encyclopedia/{id}` route cannot tell them apart on its own. Callers that know
 * which kind they linked to pass `kind`; without it we probe news, then herbal.
 */
export async function getApiEncyclopediaDetail(id: string, kind?: 'news' | 'herb'): Promise<EncyclopediaItem> {
  const fetchNews = async () => mapNews(await apiFetch<BackendNews>(`/api/user/encyclopedia/news/${id}`));
  const fetchHerbal = async () => mapHerbal(await apiFetch<BackendHerbal>(`/api/user/encyclopedia/herbal/${id}`));

  if (kind === 'herb') return fetchHerbal();
  if (kind === 'news') return fetchNews();

  try {
    return await fetchNews();
  } catch (error) {
    // Only a "no such news id" is worth re-trying against the herbal table. A 410 means the
    // entry was found and is withdrawn — falling through would have turned that answer into
    // a herbal 404 and lost the reason the page needs to show.
    if (error instanceof ApiError && error.status !== 404) throw error;
    return await fetchHerbal();
  }
}
