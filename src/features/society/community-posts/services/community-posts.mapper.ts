import type {
  BackendCommunityPost,
  BackendCommunityPostComment,
  BackendPaginated,
  CommunityPostComment,
  CommunityPostDetail,
  CommunityPostListItem,
  CommunityPostListResult,
  CommunityPostType,
} from '../types';
import type { LocalizedString } from '../../../../../types';

const fallbackText: LocalizedString = { en: '', ar: '' };

function localized(value?: Partial<LocalizedString> | null): LocalizedString {
  return {
    en: value?.en || value?.ar || '',
    ar: value?.ar || value?.en || '',
  };
}

export function getPostPath(type: CommunityPostType) {
  if (type === 'article') return 'articles';
  if (type === 'theory') return 'theories';
  return 'research';
}

export function getPostHref(type: CommunityPostType, id: string) {
  if (type === 'article') return `/community/blogs/${id}`;
  if (type === 'theory') return `/community/theories/${id}`;
  return `/community/researches/${id}`;
}

export function mapCommunityPostListItem(item: BackendCommunityPost, type: CommunityPostType): CommunityPostListItem {
  const id = String(item.id);
  return {
    id,
    type,
    title: localized(item.title),
    summary: localized(item.short_description || item.content || fallbackText),
    imageUrl: item.image || undefined,
    publishedAt: item.published_at || undefined,
    likesCount: item.likes_count ?? 0,
    commentsCount: item.comments_count ?? 0,
    isLiked: Boolean(item.is_liked),
    requiresSubscription: Boolean(item.requires_subscription),
    canViewFullContent: item.can_view_full_content ?? !item.requires_subscription,
    href: getPostHref(type, id),
  };
}

export function mapCommunityPostComment(comment: BackendCommunityPostComment): CommunityPostComment {
  return {
    id: String(comment.id),
    body: comment.body || comment.content || '',
    userName: comment.user?.name || comment.user_name || 'Member',
    createdAt: comment.created_at || comment.date || undefined,
  };
}

export function mapCommunityPostDetail(item: BackendCommunityPost, type: CommunityPostType): CommunityPostDetail {
  return {
    ...mapCommunityPostListItem(item, type),
    content: item.content ? localized(item.content) : undefined,
    allowComments: item.allow_comments ?? true,
    comments: (item.comments || []).map(mapCommunityPostComment),
  };
}

export function mapCommunityPostList(payload: BackendPaginated<BackendCommunityPost> | BackendCommunityPost[], type: CommunityPostType): CommunityPostListResult {
  if (Array.isArray(payload)) {
    return { items: payload.map((item) => mapCommunityPostListItem(item, type)) };
  }
  const items = payload.items || payload.data || [];
  return {
    items: items.map((item) => mapCommunityPostListItem(item, type)),
    pagination: payload.pagination || payload.meta,
  };
}
