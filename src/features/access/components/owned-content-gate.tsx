'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { ownsCourse, ownsEbook, ownsBundle } from '@/features/account/services/ownership.service';

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
      ? Boolean(user && ownsCourse(user.id, itemId))
      : Boolean(user && (ownsEbook(user.id, itemId) || ownsBundle(user.id, itemId)));

  return <>{owned ? children : fallback}</>;
}
