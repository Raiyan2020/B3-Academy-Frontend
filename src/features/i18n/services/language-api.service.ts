import { apiFetch } from '@/lib/api/base-fetch';
import { getLocalStorageItem, setLocalStorageItem } from '@/lib/storage/safe-local-storage';

const DEVICE_ID_KEY = 'b3-device-id';

function getDeviceId() {
  const stored = getLocalStorageItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  setLocalStorageItem(DEVICE_ID_KEY, id);
  return id;
}

export function changeBackendLanguage(lang: 'ar' | 'en') {
  return apiFetch('/api/general/change-lang', {
    method: 'POST',
    body: { device_id: getDeviceId(), lang },
  });
}
