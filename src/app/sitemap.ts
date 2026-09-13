import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

// Dynamic detail routes — /books/[bookId], /courses/[courseId], /clinic/[clinicId],
// /trips/[tripId], /consultations/[doctorId], /community/blogs/[blogId],
// /community/researches/[researchId], /community/theories/[theoryId],
// /encyclopedia/[entryId], /monograph/[monographId] — need backend data to enumerate
// and are excluded here; add them once a server-side data source is wired up.
//
// Also excluded: /order-fail, /order-pending, /order-success (transactional checkout
// outcome pages, not indexable content) and /community/chat, /community/podcast-request
// (interactive/gated flows, not content pages).
const staticRoutes: Array<{ path: string; changeFrequency: ChangeFrequency; priority: number }> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/education', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/courses', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/books', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/clinic', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/consultations', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/subscriptions', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/trips', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/ratings', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/search', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/community', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/community/blogs', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/community/cooperation', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/community/researches', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/community/theories', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/podcasts', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/encyclopedia', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/monograph', changeFrequency: 'weekly', priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return staticRoutes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
