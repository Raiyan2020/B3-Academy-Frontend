import { apiFetch } from '@/lib/api/base-fetch';
import type { GroupChatMessage, GroupChatRoom } from '../types/group-chat.types';

type ApiObject = Record<string, unknown>;

interface Paginated<T> {
  items?: T[];
  data?: T[];
}

function asArray<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || [];
}

function asObject(value: unknown): ApiObject {
  return value && typeof value === 'object' ? (value as ApiObject) : {};
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function mapRoom(item: ApiObject): GroupChatRoom {
  const lastMessage = asObject(item.last_message);
  return {
    id: String(item.id),
    is_current: Boolean(item.is_current),
    can_send: Boolean(item.can_send),
    last_message: item.last_message
      ? {
          id: String(lastMessage.id),
          body: String(lastMessage.body || ''),
          sender_name: nullableText(lastMessage.sender_name) || '',
          is_admin_message: Boolean(lastMessage.is_admin_message),
          is_deleted: Boolean(lastMessage.is_deleted),
          created_at: nullableText(lastMessage.created_at) ?? undefined,
        }
      : null,
  };
}

function mapMessage(item: ApiObject): GroupChatMessage {
  return {
    id: String(item.id),
    type: nullableText(item.type),
    body: String(item.body || ''),
    is_admin_message: Boolean(item.is_admin_message),
    sender_name: String(item.sender_name || ''),
    is_deleted: Boolean(item.is_deleted),
    created_at: nullableText(item.created_at),
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
