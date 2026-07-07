'use client';

import { useQuery } from '@tanstack/react-query';
import { getCommunityPosts } from '../services/community-posts.service';
import type { CommunityPostType } from '../types';
import { communityPostKeys } from './community-posts.keys';

export function useCommunityPostList(type: CommunityPostType, filters?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: communityPostKeys.list(type, filters),
    queryFn: () => getCommunityPosts(type, filters),
  });
}
