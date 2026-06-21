'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/auth-provider';

export function OwnedContentGate({
  kind,
  itemId,
  children,
  fallback,
}: {
  kind: 'course' | 'book';
  itemId: string;
  children: ReactNode;
  fallback: ReactNode;
}) {
  const { user } = useAuth();
  const owned =
    kind === 'course'
      ? Boolean(user?.purchasedCourseIds.includes(itemId))
      : Boolean(user?.purchasedBookIds.includes(itemId));

  return <>{owned ? children : fallback}</>;
}
