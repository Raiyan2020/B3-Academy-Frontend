import type {
  BackendPlantFungiCategory,
  BackendPlantFungiEntry,
  PlantFungiCategory,
  PlantFungiDetail,
  PlantFungiEntry,
} from '../types';
import type { LocalizedString } from '../../../../../types';

function localized(value?: Partial<LocalizedString> | string | null): LocalizedString {
  if (typeof value === 'string') return { en: value, ar: value };
  return {
    en: value?.en || value?.ar || '',
    ar: value?.ar || value?.en || '',
  };
}

export function mapPlantFungiCategory(item: BackendPlantFungiCategory): PlantFungiCategory {
  return {
    id: String(item.id),
    name: localized(item.name),
  };
}

function resolveTypeLabel(item: BackendPlantFungiEntry) {
  if (typeof item.type === 'string') return item.type;
  return item.type?.label || item.type?.name || item.type?.value || '';
}

export function mapPlantFungiEntry(item: BackendPlantFungiEntry): PlantFungiEntry {
  const id = String(item.id);
  return {
    id,
    name: localized(item.name),
    imageUrl: item.image || undefined,
    typeLabel: resolveTypeLabel(item),
    briefDescription: localized(item.brief_description),
    category: item.category ? mapPlantFungiCategory(item.category) : undefined,
    href: `/monograph/${id}`,
  };
}

export function mapPlantFungiDetail(item: BackendPlantFungiEntry): PlantFungiDetail {
  return {
    ...mapPlantFungiEntry(item),
    scientificName: item.scientific_name || undefined,
    description: localized(item.description),
    properties: localized(item.properties),
    benefits: localized(item.benefits),
    warnings: localized(item.warnings),
    family: localized(item.family),
    origin: localized(item.origin),
    distribution: localized(item.distribution),
  };
}
