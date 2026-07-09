import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/lib/api/base-fetch';
import {
  getApiEncyclopediaNews,
  getApiHerbalFamilies,
  getApiHerbalLibrary,
} from './encyclopedia-api.service';

vi.mock('@/lib/api/base-fetch', () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);

describe('encyclopedia API contract', () => {
  beforeEach(() => apiFetchMock.mockReset());

  it('uses nested backend filters for news and herbal lists', async () => {
    apiFetchMock.mockResolvedValue({ items: [] });

    await getApiEncyclopediaNews('medicine', '4');
    await getApiHerbalLibrary({
      search: 'mint',
      familyId: '1',
      speciesId: '2',
      genusId: '3',
      originId: '5',
    });

    expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/api/user/encyclopedia/news', {
      query: {
        'filters[search]': 'medicine',
        'filters[encyclopedia_news_type_id]': '4',
        per_page: 50,
      },
    });
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, '/api/user/encyclopedia/herbal', {
      query: {
        'filters[search]': 'mint',
        'filters[family_id]': '1',
        'filters[species_id]': '2',
        'filters[genus_id]': '3',
        'filters[origin_id]': '5',
        per_page: 50,
      },
    });
  });

  it('maps classification endpoints', async () => {
    apiFetchMock.mockResolvedValue([{ id: 1, name: 'Family' }]);
    await expect(getApiHerbalFamilies()).resolves.toEqual([{ id: '1', name: 'Family' }]);
    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/encyclopedia/herbal/families');
  });
});
