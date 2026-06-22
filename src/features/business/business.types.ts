import type { LocalizedString } from '../../../types';
import type { AccessLevel } from './status.types';

export type { AccessLevel } from './status.types';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'AED' | 'JPY' | 'CNH';

export type BusinessContentKind =
  | 'course'
  | 'book'
  | 'encyclopedia'
  | 'clinic'
  | 'consultation'
  | 'trip'
  | 'podcast'
  | 'blog'
  | 'theory'
  | 'research'
  | 'faq'
  | 'subscription'
  | 'monograph'
  | 'community-section';

export interface BusinessContentMeta {
  isActive: boolean;
  isFeatured?: boolean;
  accessLevel?: AccessLevel;
  categoryId?: string;
  displayOrder?: number;
  publishedAt?: string;
}

export interface SearchResultItem {
  id: string;
  kind: BusinessContentKind;
  title: LocalizedString;
  description: LocalizedString;
  href: string;
  meta: BusinessContentMeta;
}

export interface SubscriptionPlan {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  features: LocalizedString[];
  durationDays: number;
  prices: Record<CurrencyCode, number>;
  isActive: boolean;
}

export interface CommunitySection {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  href: string;
  accessLevel: AccessLevel;
  isActive: boolean;
}
