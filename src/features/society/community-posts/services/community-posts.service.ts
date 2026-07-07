import { apiFetch } from '@/lib/api/base-fetch';
import type {
  BackendCommunityPost,
  BackendCommunityPostComment,
  BackendPaginated,
  CommunityPostDetail,
  CommunityPostListResult,
  CommunityPostType,
} from '../types';
import {
  getPostPath,
  mapCommunityPostComment,
  mapCommunityPostDetail,
  mapCommunityPostList,
} from './community-posts.mapper';

export async function getCommunityPosts(type: CommunityPostType, filters?: { search?: string; page?: number }) {
  const payload = await apiFetch<BackendPaginated<BackendCommunityPost> | BackendCommunityPost[]>(
    `/api/user/${getPostPath(type)}`,
    {
      query: {
        'filters[search]': filters?.search,
        page: filters?.page,
      },
    },
  );
  return mapCommunityPostList(payload, type);
}

export async function getCommunityPostDetail(type: CommunityPostType, id: string): Promise<CommunityPostDetail> {
  const payload = await apiFetch<BackendCommunityPost>(`/api/user/${getPostPath(type)}/${id}`);
  return mapCommunityPostDetail(payload, type);
}

export async function getCommunityPostComments(type: CommunityPostType, id: string, page?: number) {
  const payload = await apiFetch<BackendPaginated<BackendCommunityPostComment> | BackendCommunityPostComment[]>(
    `/api/user/${getPostPath(type)}/${id}/comments`,
    { query: { page } },
  );
  const items = Array.isArray(payload) ? payload : payload.items || payload.data || [];
  return {
    items: items.map(mapCommunityPostComment),
    pagination: Array.isArray(payload) ? undefined : payload.pagination || payload.meta,
  };
}

export async function toggleCommunityPostLike(type: CommunityPostType, id: string) {
  return apiFetch<{ is_liked?: boolean }>(`/api/user/${getPostPath(type)}/${id}/toggle-like`, {
    method: 'POST',
  });
}

export async function createCommunityPostComment(type: CommunityPostType, id: string, body: string) {
  const payload = await apiFetch<BackendCommunityPostComment>(`/api/user/${getPostPath(type)}/${id}/comments`, {
    method: 'POST',
    body: { body },
  });
  return mapCommunityPostComment(payload);
}
