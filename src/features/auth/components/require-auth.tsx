'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../auth-provider';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  // `user` is restored asynchronously by the auth provider, so it is null on the first
  // render even for a fully signed-in visitor. Acting on `!user` alone therefore fired
  // the login modal at every already-authenticated user who opened a protected page —
  // the page rendered correctly underneath once the user resolved, but the modal had
  // already been opened and stayed up over it. `isAuthReady` is the provider's own
  // "restore finished" flag (podcast-player-provider gates on it the same way); until
  // it flips, we know nothing about the visitor and must not conclude they are signed out.
  const { user, isAuthReady, requireAuthAction } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthReady || user) return;

    savePendingIntent({
      type: 'favorite.add',
      href: pathname,
      returnUrl: pathname,
      sourceUrl: pathname,
      label: 'Protected page',
    });
    requireAuthAction(() => router.replace(pathname));
  }, [isAuthReady, pathname, requireAuthAction, router, user]);

  if (!isAuthReady) return <div className="mx-auto max-w-xl p-8 text-center text-slate-600">جارٍ التحقق من الجلسة…</div>;

  if (!user) return <div className="mx-auto max-w-xl p-8 text-center text-slate-600">يجب تسجيل الدخول لعرض هذه الصفحة.</div>;

  return <>{children}</>;
}
