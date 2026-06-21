import type { BusinessContentMeta } from './business.types';

export function isActiveContent<T extends { meta?: Partial<BusinessContentMeta> }>(item: T) {
  return item.meta?.isActive !== false;
}

export function isFeaturedContent<T extends { meta?: Partial<BusinessContentMeta> }>(item: T) {
  return isActiveContent(item) && item.meta?.isFeatured === true;
}

export function canReadSubscriberContent(isSubscribed?: boolean) {
  return Boolean(isSubscribed);
}

export function getLockedReason(accessLevel: BusinessContentMeta['accessLevel'], isSubscribed?: boolean) {
  if (accessLevel === 'subscriber' && !isSubscribed) {
    return 'هذا المحتوى متاح للمشتركين فقط.';
  }

  return null;
}

