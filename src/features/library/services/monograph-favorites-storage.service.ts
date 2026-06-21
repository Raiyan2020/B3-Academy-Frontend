import { readLocalStorageJson, STORAGE_KEYS, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

export function getMonographFavorites() {
  return readLocalStorageJson<string[]>(STORAGE_KEYS.monographFavorites, []);
}

export function saveMonographFavorites(ids: string[]) {
  writeLocalStorageJson(STORAGE_KEYS.monographFavorites, ids);
}

export function toggleMonographFavorite(id: string | undefined) {
  if (!id) return [];
  const favorites = getMonographFavorites();
  const next = favorites.includes(id)
    ? favorites.filter((favoriteId) => favoriteId !== id)
    : [...favorites, id];
  saveMonographFavorites(next);
  return next;
}
