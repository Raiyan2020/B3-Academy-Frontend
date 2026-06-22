import type { SearchResultItem } from '@/features/business/business.types';
import { getBooks } from '@/features/books/services/books.service';
import { getCourses } from '@/features/courses/services/courses.service';
import { getEncyclopediaEntries } from '@/features/library/services/encyclopedia.service';
import { getActiveCommunitySections } from '@/features/community/services/community-sections.service';
import { getBlogs, getResearches, getTheories } from '@/features/community/services/community-content.service';
import { getPodcasts } from '@/features/podcasts/services/podcasts.service';
import { CARE_DOCTORS, getActiveClinics, getActiveTripPackages } from '@/features/care/services/care-data.service';
import { getBookMetadata } from '@/features/books/services/books.service';
import { getCourseMetadata } from '@/features/courses/services/courses.service';
import { getFaqEntries } from '@/features/site-content/services/faq-content.service';
import { getActiveSubscriptionPlans } from '@/features/subscriptions/services/subscriptions.service';
import { getMonographs } from '@/features/library/services/monograph.service';

export function buildSearchIndex(): SearchResultItem[] {
  const courses: SearchResultItem[] = getCourses().map((course) => ({
    id: course.id,
    kind: 'course',
    title: course.title,
    description: course.description,
    href: `/courses/${course.id}`,
    meta: { isActive: true, isFeatured: getCourseMetadata(course.id)?.isFeatured, accessLevel: 'public', categoryId: course.topics[0]?.en, publishedAt: getCourseMetadata(course.id)?.publishedAt },
  }));

  const books: SearchResultItem[] = getBooks().map((book) => ({
    id: book.id,
    kind: 'book',
    title: book.title,
    description: book.description,
    href: `/books/${book.id}`,
    meta: { isActive: true, isFeatured: getBookMetadata(book.id)?.isFeatured, accessLevel: 'public', categoryId: book.topics[0]?.en, publishedAt: getBookMetadata(book.id)?.publishedAt },
  }));

  const encyclopedia: SearchResultItem[] = getEncyclopediaEntries().map((entry) => ({
    id: entry.id,
    kind: 'encyclopedia',
    title: entry.title,
    description: entry.summary,
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

  const content: SearchResultItem[] = [
    ...getBlogs().map((item) => ({ id: item.id, kind: 'blog' as const, title: item.title, description: item.content, href: `/community/blogs/${item.id}`, meta: { isActive: true, accessLevel: 'public' as const, publishedAt: item.date } })),
    ...getTheories().map((item) => ({ id: item.id, kind: 'theory' as const, title: item.title, description: item.content, href: `/community/theories/${item.id}`, meta: { isActive: true, accessLevel: 'public' as const, publishedAt: item.date } })),
    ...getResearches().map((item) => ({ id: item.id, kind: 'research' as const, title: item.title, description: item.content, href: `/community/researches/${item.id}`, meta: { isActive: true, accessLevel: 'subscriber' as const, publishedAt: item.date } })),
  ];
  const podcasts: SearchResultItem[] = getPodcasts().map((item) => ({ id: item.id, kind: 'podcast', title: item.title, description: item.description, href: '/podcasts', meta: { isActive: true, accessLevel: 'public', categoryId: item.category.en } }));
  const clinics: SearchResultItem[] = getActiveClinics().map((item) => ({ id: item.id, kind: 'clinic', title: item.name, description: item.shortDescription, href: `/clinic/${item.id}`, meta: { isActive: item.isActive, accessLevel: 'public', categoryId: item.category.en } }));
  const consultations: SearchResultItem[] = CARE_DOCTORS.map((item) => ({ id: item.id, kind: 'consultation', title: item.name, description: item.bio, href: `/consultations/${item.id}/book`, meta: { isActive: true, accessLevel: 'public' } }));
  const trips: SearchResultItem[] = getActiveTripPackages().map((item) => ({ id: item.id, kind: 'trip', title: item.title, description: item.description, href: `/trips/${item.id}`, meta: { isActive: item.isActive, accessLevel: 'public', categoryId: item.category } }));

  const faq: SearchResultItem[] = getFaqEntries().map((item) => ({
    id: item.id,
    kind: 'faq' as const,
    title: item.question,
    description: item.answer,
    href: '/faq',
    meta: { isActive: true, accessLevel: 'public' as const },
  }));

  const subscriptions: SearchResultItem[] = getActiveSubscriptionPlans().map((plan) => ({
    id: plan.id,
    kind: 'subscription' as const,
    title: plan.name,
    description: plan.description,
    href: `/checkout/subscription/${plan.id}`,
    meta: { isActive: plan.isActive, accessLevel: 'public' as const },
  }));

  const monographs: SearchResultItem[] = getMonographs().map((item) => ({
    id: item.id,
    kind: 'monograph' as const,
    title: item.name,
    description: item.description,
    href: `/monograph/${item.id}`,
    meta: { isActive: item.metadata.status === 'active', accessLevel: item.metadata.accessLevel },
  }));

  return [...courses, ...books, ...encyclopedia, ...community, ...content, ...podcasts, ...clinics, ...consultations, ...trips, ...faq, ...subscriptions, ...monographs].filter((item) => item.meta.isActive);
}

export function searchSite(query: string) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  return buildSearchIndex().filter((item) => {
    const searchable = [item.title.ar, item.title.en, item.description.ar, item.description.en]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return normalizeSearchText(searchable).includes(normalized);
  });
}

export function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');
}

export function groupSearchResults(results: SearchResultItem[]) {
  return results.reduce<Record<string, SearchResultItem[]>>((groups, result) => {
    groups[result.kind] = groups[result.kind] || [];
    groups[result.kind].push(result);
    return groups;
  }, {});
}
