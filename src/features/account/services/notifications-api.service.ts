import { apiFetch } from '@/lib/api/base-fetch';

export interface BackendNotification {
  id: string;
  type?: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt?: string | null;
  href?: string;
}

interface BackendNotificationPayload {
  id: string;
  type?: string;
  title?: string | null;
  body?: string | null;
  data?: Record<string, unknown> | null;
  is_read?: boolean;
  created_at?: string | null;
  // `Notification::getClientUrlAttribute()` resolves the destination and
  // `getIsLinkAvailableAttribute()` reports whether the referenced entity still exists.
  url?: string | null;
  is_link_available?: boolean;
}

// The backend's client URLs are shared with the mobile client, so a couple of them name a
// resource rather than a page that exists in this app. Translating them here keeps the
// mismatch in one place; anything left untranslated simply fails the caller's
// `isResolvableNotificationHref()` guard and renders the "link unavailable" note, which is
// the honest outcome for a destination the web app has no page for (e.g. a single care
// booking, which may be either a clinic visit or a consultation).
const CLIENT_HREF_OVERRIDES: Record<string, string> = {
  '/subscriptions/me': '/dashboard/subscription',
};

function clientHref(input: BackendNotificationPayload) {
  if (!input.url || input.is_link_available === false) return undefined;
  if (CLIENT_HREF_OVERRIDES[input.url]) return CLIENT_HREF_OVERRIDES[input.url];
  // `/my-books/12` — the web app lists purchased books but has no per-book page.
  if (input.url.startsWith('/my-books/')) return '/dashboard/books';
  return input.url;
}

interface BackendNotificationsList {
  items?: BackendNotificationPayload[];
  data?: BackendNotificationPayload[];
  unread_count?: number;
}

function getItems(payload: BackendNotificationPayload[] | BackendNotificationsList) {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

function mapNotification(input: BackendNotificationPayload): BackendNotification {
  return {
    id: input.id,
    type: input.type,
    title: input.title || '',
    body: input.body || '',
    data: input.data,
    // Was `input.data?.href` — a key the backend never emits, so this was always
    // undefined and no notification ever rendered either the "open link" action or the
    // "link unavailable" note. The destination lives in the top-level `url` field.
    href: clientHref(input),
    isRead: Boolean(input.is_read),
    createdAt: input.created_at,
  };
}

export async function getBackendNotifications() {
  const response = await apiFetch<BackendNotificationPayload[] | BackendNotificationsList>('/api/user/notifications', {
    query: { per_page: 50 },
  });
  return {
    items: getItems(response).map(mapNotification),
    unreadCount: Array.isArray(response) ? undefined : response.unread_count,
  };
}

export async function getBackendUnreadNotificationCount() {
  const response = await apiFetch<{ unread_count?: number }>('/api/user/notifications/unread-count');
  return response.unread_count ?? 0;
}

export async function getBackendNotification(id: string) {
  const response = await apiFetch<BackendNotificationPayload>(`/api/user/notifications/${id}`);
  return mapNotification(response);
}

export async function markBackendNotificationRead(id: string) {
  return apiFetch<{ unread_count?: number }>(`/api/user/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllBackendNotificationsRead() {
  return apiFetch<{ unread_count?: number }>('/api/user/notifications/read-all', { method: 'POST' });
}

export async function deleteBackendNotification(id: string) {
  return apiFetch<{ unread_count?: number }>(`/api/user/notifications/${id}`, { method: 'DELETE' });
}

export async function deleteManyBackendNotifications(ids: string[]) {
  return apiFetch<{ unread_count?: number }>('/api/user/notifications/delete-many', {
    method: 'POST',
    body: { ids },
  });
}

export async function clearAllBackendNotifications() {
  return apiFetch<{ unread_count?: number }>('/api/user/notifications/clear-all', { method: 'DELETE' });
}

export async function toggleBackendNotifications() {
  return apiFetch<{ is_notifiable?: boolean }>('/api/user/notifications/toggle', { method: 'POST' });
}
