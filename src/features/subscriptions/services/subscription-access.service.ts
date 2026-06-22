import type { User } from '../../../../types';

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
