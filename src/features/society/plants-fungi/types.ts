import type { LocalizedString } from '../../../../types';

export interface BackendPlantFungiCategory {
  id: number | string;
  name?: Partial<LocalizedString> | null;
}

export interface BackendPlantFungiType {
  value?: string;
  label?: string;
  name?: string;
}

export interface BackendPlantFungiEntry {
  id: number | string;
  image?: string | null;
  name?: Partial<LocalizedString> | null;
  scientific_name?: string | null;
  type?: BackendPlantFungiType | string | null;
  brief_description?: string | null;
  category?: BackendPlantFungiCategory | null;
  description?: Partial<LocalizedString> | string | null;
  properties?: Partial<LocalizedString> | string | null;
  benefits?: Partial<LocalizedString> | string | null;
  warnings?: Partial<LocalizedString> | string | null;
  family?: Partial<LocalizedString> | string | null;
  origin?: Partial<LocalizedString> | string | null;
  distribution?: Partial<LocalizedString> | string | null;
}

export interface BackendPaginated<T> {
  items?: T[];
  data?: T[];
  pagination?: unknown;
  meta?: unknown;
}

export interface PlantFungiCategory {
  id: string;
  name: LocalizedString;
}

export interface PlantFungiEntry {
  id: string;
  name: LocalizedString;
  imageUrl?: string;
  typeLabel: string;
  briefDescription: LocalizedString;
  category?: PlantFungiCategory;
  href: string;
}

export interface PlantFungiDetail extends PlantFungiEntry {
  scientificName?: string;
  description?: LocalizedString;
  properties?: LocalizedString;
  benefits?: LocalizedString;
  warnings?: LocalizedString;
  family?: LocalizedString;
  origin?: LocalizedString;
  distribution?: LocalizedString;
}
