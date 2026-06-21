'use client';

import { SiteLayout } from '@/features/navigation/components/site-layout';

export function SitePage({ children }: { children: React.ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}

export function PlainPage({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
