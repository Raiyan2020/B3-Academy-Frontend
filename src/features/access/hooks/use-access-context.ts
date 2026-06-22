'use client';

import { useAuth } from '@/features/auth/auth-provider';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';
import type { CommunityAccessContext } from '@/features/community/types/community.types';

export function useCommunityAccessContext(): CommunityAccessContext {
  const { user } = useAuth();
  return {
    userId: user?.id,
    isAuthenticated: Boolean(user),
    isSubscribed: isSubscriptionActive(user),
  };
}

export function useSubscriptionActive(): boolean {
  const { user } = useAuth();
  return isSubscriptionActive(user);
}
