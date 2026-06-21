import { MOCK_MONOGRAPHS } from '../data/monographs.mock';

export function getMonographs() {
  return MOCK_MONOGRAPHS;
}

export function getMonographById(id: string | undefined) {
  if (!id) return undefined;
  return MOCK_MONOGRAPHS.find((entry) => entry.id === id);
}
