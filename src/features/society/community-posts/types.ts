import type { LocalizedString } from '../../../../types';

export type CommunityPostType = 'article' | 'theory' | 'research';

export interface BackendCommunityPost {
  id: number | string;
  type?: string;
  image?: string | null;
  title?: Partial<LocalizedString> | null;
  short_description?: Partial<LocalizedString> | null;
  content?: Partial<LocalizedString> | null;
  published_at?: string | null;
  allow_comments?: boolean;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_editor_pick?: boolean;
  requires_subscription?: boolean;
  can_view_full_content?: boolean;
  comments?: BackendCommunityPostComment[];
}

export interface BackendCommunityPostComment {
  id: number | string;
  body?: string;
  content?: string;
  user?: { id?: number | string; name?: string };
  user_id?: number | string;
  user_name?: string;
  created_at?: string;
  date?: string;
}

export interface BackendPaginated<T> {
  items?: T[];
  data?: T[];
  pagination?: unknown;
  meta?: unknown;
}

export interface CommunityPostListItem {
  id: string;
  type: CommunityPostType;
  title: LocalizedString;
  summary: LocalizedString;
  imageUrl?: string;
  publishedAt?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  requiresSubscription: boolean;
  canViewFullContent: boolean;
  href: string;
}

export interface CommunityPostComment {
  id: string;
  body: string;
  userName: string;
  createdAt?: string;
}

export interface CommunityPostDetail extends CommunityPostListItem {
  content?: LocalizedString;
  allowComments: boolean;
  comments: CommunityPostComment[];
}

export interface CommunityPostListResult {
  items: CommunityPostListItem[];
  pagination?: unknown;
}
