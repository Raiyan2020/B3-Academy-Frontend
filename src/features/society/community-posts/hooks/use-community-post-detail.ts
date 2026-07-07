'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCommunityPostComment,
  getCommunityPostComments,
  getCommunityPostDetail,
  toggleCommunityPostLike,
} from '../services/community-posts.service';
import type { CommunityPostType } from '../types';
import { communityPostKeys } from './community-posts.keys';

export function useCommunityPostDetail(type: CommunityPostType, id: string | undefined) {
  const queryClient = useQueryClient();
  const postId = id || '';
  const detail = useQuery({
    queryKey: communityPostKeys.detail(type, postId),
    queryFn: () => getCommunityPostDetail(type, postId),
    enabled: Boolean(id),
  });
  const comments = useQuery({
    queryKey: communityPostKeys.comments(type, postId),
    queryFn: () => getCommunityPostComments(type, postId),
    enabled: Boolean(id && detail.data?.canViewFullContent),
  });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: communityPostKeys.detail(type, postId) });
    queryClient.invalidateQueries({ queryKey: communityPostKeys.comments(type, postId) });
    queryClient.invalidateQueries({ queryKey: communityPostKeys.list(type) });
  };
  const like = useMutation({
    mutationFn: () => toggleCommunityPostLike(type, postId),
    onSuccess: invalidate,
    meta: { silentSuccess: true },
  });
  const comment = useMutation({
    mutationFn: (body: string) => createCommunityPostComment(type, postId, body),
    onSuccess: invalidate,
    meta: { silentSuccess: true },
  });

  return { detail, comments, like, comment };
}
