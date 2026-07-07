import type { BackendCooperationType, CooperationType } from '../types';

export function mapCooperationType(item: BackendCooperationType): CooperationType {
  return {
    id: String(item.id),
    name: {
      en: item.name?.en || item.name?.ar || '',
      ar: item.name?.ar || item.name?.en || '',
    },
    description: {
      en: item.description?.en || item.description?.ar || '',
      ar: item.description?.ar || item.description?.en || '',
    },
  };
}
