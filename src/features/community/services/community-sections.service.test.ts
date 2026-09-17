import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/lib/api/base-fetch';
import { getCommunitySections } from './community-sections.service';

vi.mock('@/lib/api/base-fetch', () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('community-sections.service', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('maps backend sections to site routes and drops ones with no page', async () => {
    apiFetchMock.mockResolvedValueOnce({
      sections: [
        { key: 'articles', name: 'Articles', description: 'Read articles.', requires_login: false, requires_subscription: false, can_access: true },
        { key: 'plants_fungi', name: 'Plants and fungi', description: 'Encyclopedia.', requires_login: true, requires_subscription: true, can_access: false },
        { key: 'unknown_future_section', name: 'Mystery', description: '' },
      ],
    });

    const sections = await getCommunitySections();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/community');
    expect(sections.map((section) => section.key)).toEqual(['articles', 'plants_fungi']);
    expect(sections[0].href).toBe('/community/blogs');
    expect(sections[1]).toMatchObject({
      href: '/monograph',
      requiresSubscription: true,
      canAccess: false,
    });
  });
});
