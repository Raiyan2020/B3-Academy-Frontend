'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { savePendingIntent } from '../services/pending-intent.service';
import type { PendingIntentInput } from '../types/access.types';

export function AuthActionGate({
  children,
  intent,
  onAllowed,
}: {
  children: (props: { onClick: () => void; isAuthenticated: boolean }) => ReactNode;
  intent: PendingIntentInput;
  onAllowed?: () => void;
}) {
  const { user, requireAuthAction } = useAuth();

  return children({
    isAuthenticated: Boolean(user),
    onClick: () => {
      if (!user) savePendingIntent(intent);
      if (!requireAuthAction()) return;
      onAllowed?.();
    },
  });
}
