import type { User } from '@/types';
import type { MySubscriptionResponse } from '../types/api.types';

export function isSubscriptionActive(
  user: Pick<User, 'isSubscribed' | 'subscriptionExpiryDate'> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!user?.isSubscribed) return false;
  if (!user.subscriptionExpiryDate) return true;
  const expiry = new Date(user.subscriptionExpiryDate);
  if (Number.isNaN(expiry.getTime())) return Boolean(user.isSubscribed);
  return expiry.getTime() > now.getTime();
}

/**
 * Backend-sourced replacement for `isSubscriptionActive`. Reads the live
 * `GET /subscriptions/me` result (via `useMySubscription`/`useIsSubscriptionActive`)
 * instead of the local, possibly-stale `user.isSubscribed` / `user.subscriptionExpiryDate`
 * pair, so a successful checkout unlocks gated content as soon as the query cache is
 * invalidated — no reload or relogin required.
 */
export function isSubscriptionRecordActive(
  subscription: MySubscriptionResponse | null | undefined,
  now: Date = new Date(),
): boolean {
  const active = subscription?.active;
  if (!active) return false;
  if (!active.endsAt) return true;
  const expiry = new Date(active.endsAt);
  if (Number.isNaN(expiry.getTime())) return true;
  return expiry.getTime() > now.getTime();
}

export function getSubscriptionExpiryState(
  user: Pick<User, 'isSubscribed' | 'subscriptionExpiryDate'> | null | undefined,
  now: Date = new Date(),
): 'none' | 'active' | 'expired' {
  if (!user?.isSubscribed) return 'none';
  if (!user.subscriptionExpiryDate) return 'active';
  const expiry = new Date(user.subscriptionExpiryDate);
  if (Number.isNaN(expiry.getTime())) return 'active';
  return expiry.getTime() > now.getTime() ? 'active' : 'expired';
}
