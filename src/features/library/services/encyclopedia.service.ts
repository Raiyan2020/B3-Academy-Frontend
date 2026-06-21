import { MOCK_ENTRIES } from '../data/encyclopedia.mock';

export function getEncyclopediaEntries() {
  return MOCK_ENTRIES;
}

export function getEntryById(id: string | undefined) {
  if (!id) return undefined;
  return MOCK_ENTRIES.find((entry) => entry.id === id);
}
