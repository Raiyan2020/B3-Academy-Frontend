import { apiFetch } from '@/lib/api/base-fetch';

export interface CommunitySection {
  key: string;
  name: string;
  description: string;
  href: string;
  requiresSubscription: boolean;
  canAccess: boolean;
}

/**
 * Backend section key -> the page that renders it. The backend returns its own API
 * endpoint for each section, not a site route, so the mapping lives here. A key with
 * no entry is dropped rather than rendered as a card that links nowhere.
 */
const SECTION_HREF: Record<string, string> = {
  group_chat: '/community/chat',
  podcast: '/podcasts',
  articles: '/community/blogs',
  theories: '/community/theories',
  research: '/community/researches',
  collaboration: '/community/cooperation',
  plants_fungi: '/monograph',
};

interface BackendCommunitySection {
  key: string;
  name?: string;
  description?: string;
  requires_subscription?: boolean;
  can_access?: boolean;
}

export async function getCommunitySections(): Promise<CommunitySection[]> {
  const payload = await apiFetch<{ sections?: BackendCommunitySection[] } | BackendCommunitySection[]>(
    '/api/user/community',
  );
  const sections = Array.isArray(payload) ? payload : payload?.sections || [];

  return sections
    .filter((section) => Boolean(SECTION_HREF[section.key]))
    .map((section) => ({
      key: section.key,
      name: section.name || section.key,
      description: section.description || '',
      href: SECTION_HREF[section.key],
      requiresSubscription: Boolean(section.requires_subscription),
      canAccess: section.can_access ?? true,
    }));
}
