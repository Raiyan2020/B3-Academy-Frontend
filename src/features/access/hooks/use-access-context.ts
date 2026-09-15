import { useAuth } from '@/features/auth/auth-provider';
import { useIsSubscriptionActive } from '@/features/subscriptions/hooks/use-subscriptions';
import type { CommunityAccessContext } from '@/features/community/types/community.types';

export function useCommunityAccessContext(): CommunityAccessContext {
  const { user } = useAuth();
  const isSubscribed = useIsSubscriptionActive();
  return {
    userId: user?.id,
    isAuthenticated: Boolean(user),
    isSubscribed,
  };
}

export function useSubscriptionActive(): boolean {
  return useIsSubscriptionActive();
}
