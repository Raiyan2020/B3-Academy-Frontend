import type { AccessLevel, ContentStatus } from '@/features/business/status.types';
import type { Blog, Comment, LocalizedString, Research, Theory } from '../../../../types';

export type CommunityContentKind = 'article' | 'theory' | 'research';

export interface CommunityContentMetadata {
  status: ContentStatus;
  accessLevel: AccessLevel;
  displayOrder: number;
  publishedAt: string;
  category?: string;
  summary?: LocalizedString;
}

export type CommunityArticle = Blog & { kind: 'article'; metadata: CommunityContentMetadata };
export type CommunityTheory = Theory & { kind: 'theory'; metadata: CommunityContentMetadata };
export type CommunityResearch = Research & { kind: 'research'; metadata: CommunityContentMetadata };
export type CommunityContentItem = CommunityArticle | CommunityTheory | CommunityResearch;

export interface CommunityAccessContext {
  userId?: string;
  isSubscribed: boolean;
  isAuthenticated: boolean;
}
