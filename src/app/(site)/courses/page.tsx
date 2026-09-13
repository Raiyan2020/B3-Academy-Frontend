import type { Metadata } from 'next';
import { CoursesPageClient } from './courses-page-client';

// This page.tsx is one of only 4 of 94 that is a Server Component, so it is one of the
// few that can export metadata at all. Wording is taken from the app's own
// `catalog.courses.title` string rather than invented, and is Arabic to match the
// root layout's <html lang="ar" dir="rtl">. Static metadata cannot follow the runtime
// language switch, which lives in client-side storage.
export const metadata: Metadata = {
  title: 'جميع الدورات | B3 Academy',
  description: 'تصفح دورات أكاديمية B3 في الفلسفة الطبيعية والعلوم النفسية.',
};

export default function Page() {
  return <CoursesPageClient />;
}

