import type { SearchResultItem } from '@/features/business/business.types';
import { getBooks } from '@/features/books/services/books.service';
import { getCourses } from '@/features/courses/services/courses.service';
import { getEncyclopediaEntries } from '@/features/library/services/encyclopedia.service';
import { getActiveCommunitySections } from '@/features/community/services/community-sections.service';

export function buildSearchIndex(): SearchResultItem[] {
  const courses: SearchResultItem[] = getCourses().map((course) => ({
    id: course.id,
    kind: 'course',
    title: course.title,
    description: course.description,
    href: `/courses/${course.id}`,
    meta: { isActive: true, isFeatured: false, accessLevel: 'public', categoryId: course.topics[0]?.en },
  }));

  const books: SearchResultItem[] = getBooks().map((book) => ({
    id: book.id,
    kind: 'book',
    title: book.title,
    description: book.description,
    href: `/books/${book.id}`,
    meta: { isActive: true, isFeatured: false, accessLevel: 'public', categoryId: book.topics[0]?.en },
  }));

  const encyclopedia: SearchResultItem[] = getEncyclopediaEntries().map((entry) => ({
    id: entry.id,
    kind: 'encyclopedia',
    title: entry.name,
    description: entry.description,
    href: `/encyclopedia/${entry.id}`,
    meta: { isActive: true, accessLevel: 'public' },
  }));

  const community: SearchResultItem[] = getActiveCommunitySections().map((section) => ({
    id: section.id,
    kind: 'community-section',
    title: section.title,
    description: section.description,
    href: section.href,
    meta: { isActive: section.isActive, accessLevel: section.accessLevel },
  }));

  return [...courses, ...books, ...encyclopedia, ...community].filter((item) => item.meta.isActive);
}

export function searchSite(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return buildSearchIndex().filter((item) => {
    const searchable = [item.title.ar, item.title.en, item.description.ar, item.description.en]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalized);
  });
}

export function groupSearchResults(results: SearchResultItem[]) {
  return results.reduce<Record<string, SearchResultItem[]>>((groups, result) => {
    groups[result.kind] = groups[result.kind] || [];
    groups[result.kind].push(result);
    return groups;
  }, {});
}

