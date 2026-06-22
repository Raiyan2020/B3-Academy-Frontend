'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../auth-provider';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, requireAuthAction } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      savePendingIntent({
        type: 'favorite.add',
        href: pathname,
        returnUrl: pathname,
        sourceUrl: pathname,
        label: 'Protected page',
      });
      requireAuthAction(() => router.replace(pathname));
    }
  }, [pathname, requireAuthAction, router, user]);

  if (!user) return <div className="mx-auto max-w-xl p-8 text-center text-slate-600">Authentication is required to view this page.</div>;

  return <>{children}</>;
}
