import type { ContentStatus } from '@/features/business/status.types';
import type { LocalizedString } from '../../../../types';

export type EncyclopediaItemKind = 'news' | 'herb';

export type HerbFilterDimension = 'type' | 'family' | 'sex' | 'origin';

export interface EncyclopediaItemBase {
  id: string;
  kind: EncyclopediaItemKind;
  status: ContentStatus;
  isEditorPick: boolean;
  displayOrder: number;
  publishedAt: string;
  image: string;
  title: LocalizedString;
  summary: LocalizedString;
  fullContent: LocalizedString;
}

export interface EncyclopediaNewsItem extends EncyclopediaItemBase {
  kind: 'news';
  category: LocalizedString;
}

export interface EncyclopediaHerbItem extends EncyclopediaItemBase {
  kind: 'herb';
  scientificName: string;
  category: 'plants' | 'fungi';
  tags: string[];
  family?: LocalizedString;
  originCountry?: LocalizedString;
  sex?: LocalizedString;
  herbType: LocalizedString;
}

export type EncyclopediaItem = EncyclopediaNewsItem | EncyclopediaHerbItem;

export interface EncyclopediaHerbFilters {
  search?: string;
  type?: string;
  family?: string;
  sex?: string;
  origin?: string;
}

export interface EncyclopediaEditorPick {
  id: string;
  entryId: string;
  displayOrder: number;
  label: LocalizedString;
}
