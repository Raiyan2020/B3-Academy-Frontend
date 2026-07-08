import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/lib/api/base-fetch';
import { getApiBooks, getBookCategories } from './books-api.service';

vi.mock('@/lib/api/base-fetch', () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('books-api.service', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('normalizes localized backend book text and availability fields', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: 12,
          name: { en: 'Compost Handbook', ar: 'Compost Arabic' },
          author: { en: 'B3 Academy', ar: 'B3 Arabic' },
          description: { en: 'Healthy soil methods', ar: 'Healthy soil Arabic' },
          book_category: { id: 2, name: { en: 'Agriculture', ar: 'Agriculture Arabic' } },
          has_ebook: true,
          has_printed: false,
          ebook_price: '9.5',
          printed_price: null,
          both_price: null,
          ownership: { copy_types: ['ebook'] },
        },
      ],
    });

    const books = await getApiBooks();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/books', {
      query: { search: undefined, page: undefined, per_page: 50 },
    });
    expect(books[0]).toMatchObject({
      id: '12',
      title: 'Compost Arabic',
      author: 'B3 Arabic',
      description: 'Healthy soil Arabic',
      category: 'Agriculture Arabic',
      availability: { ebook: true, physical: false, bundle: false },
      ownership: { ebook: true, physical: false, bundle: false },
      prices: { ebook: 9.5, physical: 0, bundle: 0 },
    });
  });

  it('normalizes localized backend category names', async () => {
    apiFetchMock.mockResolvedValueOnce([{ id: 5, name: { en: 'Books', ar: 'Books Arabic' } }]);

    await expect(getBookCategories()).resolves.toEqual([{ id: '5', name: 'Books Arabic' }]);
  });
});
