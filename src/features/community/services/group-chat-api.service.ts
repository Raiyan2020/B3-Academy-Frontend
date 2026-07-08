import { apiFetch } from '@/lib/api/base-fetch';
import type { GroupChatMessage, GroupChatRoom } from '../types/group-chat.types';

type ApiObject = Record<string, any>;

interface Paginated<T> {
  items?: T[];
  data?: T[];
}

function asArray<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || [];
}

function mapRoom(item: ApiObject): GroupChatRoom {
  return {
    id: String(item.id),
    is_current: Boolean(item.is_current),
    can_send: Boolean(item.can_send),
    last_message: item.last_message
      ? {
          id: String(item.last_message.id),
          body: String(item.last_message.body || ''),
          sender_name: item.last_message.sender_name || '',
          is_admin_message: Boolean(item.last_message.is_admin_message),
          is_deleted: Boolean(item.last_message.is_deleted),
          created_at: item.last_message.created_at || null,
        }
      : null,
  };
}

function mapMessage(item: ApiObject): GroupChatMessage {
  return {
    id: String(item.id),
    type: item.type || null,
    body: String(item.body || ''),
    is_admin_message: Boolean(item.is_admin_message),
    sender_name: String(item.sender_name || ''),
    is_deleted: Boolean(item.is_deleted),
    created_at: item.created_at || null,
  };
}

export async function getCurrentGroupChatRoom() {
  const response = await apiFetch<ApiObject>('/api/user/group-chat/current-room');
  return mapRoom(response);
}

export async function getGroupChatMessages() {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/group-chat/messages');
  return asArray(response).map(mapMessage);
}

export async function sendGroupChatMessage(input: { body: string }) {
  const body = input.body.trim();
  return apiFetch<ApiObject>('/api/user/group-chat/messages', {
    method: 'POST',
    body: { body },
  });
}
