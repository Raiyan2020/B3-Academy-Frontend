import type { User } from '../../../types';
import type { BusinessContentMeta } from './business.types';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';

export function isActiveContent<T extends { meta?: Partial<BusinessContentMeta> }>(item: T) {
  return item.meta?.isActive !== false;
}

export function isFeaturedContent<T extends { meta?: Partial<BusinessContentMeta> }>(item: T) {
  return isActiveContent(item) && item.meta?.isFeatured === true;
}

export function canReadSubscriberContent(user?: Pick<User, 'isSubscribed' | 'subscriptionExpiryDate'> | null) {
  return isSubscriptionActive(user ?? null);
}

export function getLockedReason(
  accessLevel: BusinessContentMeta['accessLevel'],
  user?: Pick<User, 'isSubscribed' | 'subscriptionExpiryDate'> | null,
) {
  if (accessLevel === 'subscriber' && !isSubscriptionActive(user ?? null)) {
    return 'هذا المحتوى متاح للمشتركين فقط.';
  }

  return null;
}
