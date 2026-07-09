import { resolveApiUrl } from './base-fetch';

function parseFilename(contentDisposition: string | null) {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  return decodeURIComponent(match?.[1] || match?.[2] || '');
}

export async function downloadAuthenticatedFile(path: string, fallbackName = 'download') {
  const token = typeof window === 'undefined' ? undefined : window.localStorage.getItem('b3_api_token') || undefined;
  const response = await fetch(resolveApiUrl(path), {
    credentials: 'omit',
    headers: {
      Accept: '*/*',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = parseFilename(response.headers.get('content-disposition')) || fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
