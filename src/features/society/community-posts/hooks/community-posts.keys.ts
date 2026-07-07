import type { CommunityPostType } from '../types';

export const communityPostKeys = {
  all: ['society', 'community-posts'] as const,
  list: (type: CommunityPostType, filters?: unknown) => [...communityPostKeys.all, type, 'list', filters] as const,
  detail: (type: CommunityPostType, id: string) => [...communityPostKeys.all, type, 'detail', id] as const,
  comments: (type: CommunityPostType, id: string, page?: number) =>
    [...communityPostKeys.all, type, 'comments', id, page] as const,
};
