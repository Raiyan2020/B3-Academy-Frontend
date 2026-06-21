'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../auth-provider';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, requireAuthAction } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      requireAuthAction(() => router.replace(pathname));
      router.replace('/');
    }
  }, [pathname, requireAuthAction, router, user]);

  if (!user) return null;

  return <>{children}</>;
}
