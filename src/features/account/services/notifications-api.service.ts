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
    href: typeof input.data?.href === 'string' ? input.data.href : undefined,
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
