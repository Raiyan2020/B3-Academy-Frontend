import type { User } from '../../../types';
import {
  readLocalStorageJson,
  removeLocalStorageItem,
  STORAGE_KEYS,
  writeLocalStorageJson,
} from '@/lib/storage/safe-local-storage';

export function readStoredUser() {
  return readLocalStorageJson<User | null>(STORAGE_KEYS.user, null);
}

export function saveStoredUser(user: User | null) {
  if (user) {
    writeLocalStorageJson(STORAGE_KEYS.user, user);
  } else {
    removeLocalStorageItem(STORAGE_KEYS.user);
  }
}
