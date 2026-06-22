import { describe, expect, it } from 'vitest';
import { buildSearchIndex, normalizeSearchText, searchSite } from './search-index.service';

describe('global search index', () => {
  it('indexes all configured business domains with valid routes', () => {
    const kinds = new Set(buildSearchIndex().map((item) => item.kind));
    for (const kind of ['course', 'book', 'encyclopedia', 'blog', 'theory', 'research', 'podcast', 'consultation', 'clinic', 'trip', 'faq', 'subscription', 'monograph']) {
      expect(kinds.has(kind as never)).toBe(true);
    }
    expect(buildSearchIndex().every((item) => item.href.startsWith('/') && item.meta.isActive)).toBe(true);
  });

  it('normalizes Arabic variants and returns an empty list for empty text', () => {
    expect(normalizeSearchText('إختبار')).toBe(normalizeSearchText('اختبار'));
    expect(searchSite('   ')).toEqual([]);
  });
});
