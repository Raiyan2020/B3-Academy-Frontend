const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.sessionStorage);

export function getSessionStorageItem(key: string): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setSessionStorageItem(key: string, value: string) {
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Session storage is optional for this demo.
  }
}
