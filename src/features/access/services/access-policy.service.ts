import type { AccessDecision, AccessRequirement, AccessSubject } from '../types/access.types';

export function evaluateAccess(subject: AccessSubject, requirement: AccessRequirement): AccessDecision {
  if (requirement.requiresActiveItem && requirement.isActiveItem === false) {
    return { allowed: false, reason: 'inactive-item' };
  }

  if (requirement.requiresAuth && !subject.isAuthenticated) {
    return { allowed: false, reason: 'auth-required' };
  }

  if (requirement.requiresSubscription && !subject.isSubscribed) {
    return { allowed: false, reason: 'subscription-required' };
  }

  if (requirement.requiresPurchase) {
    const owned =
      requirement.requiresPurchase.kind === 'course'
        ? subject.ownedCourseIds?.includes(requirement.requiresPurchase.itemId)
        : subject.ownedBookIds?.includes(requirement.requiresPurchase.itemId);

    if (!owned) return { allowed: false, reason: 'purchase-required' };
  }

  if (
    requirement.requiresCompletedConsultationId &&
    !subject.completedConsultationIds?.includes(requirement.requiresCompletedConsultationId)
  ) {
    return { allowed: false, reason: 'consultation-required' };
  }

  return { allowed: true };
}

export function getAccessMessage(reason: AccessDecision['reason'], locale: 'ar' | 'en') {
  const messages = {
    'auth-required': {
      ar: 'يجب تسجيل الدخول لإكمال هذه العملية.',
      en: 'Sign in is required to continue this action.',
    },
    'subscription-required': {
      ar: 'هذه الميزة تتطلب اشتراكاً فعّالاً.',
      en: 'This feature requires an active subscription.',
    },
    'purchase-required': {
      ar: 'يجب شراء هذا المحتوى قبل فتحه.',
      en: 'You need to purchase this content before opening it.',
    },
    'consultation-required': {
      ar: 'يجب إكمال الاستشارة المطلوبة أولاً.',
      en: 'You need to complete the required consultation first.',
    },
    'inactive-item': {
      ar: 'هذا العنصر غير متاح حالياً.',
      en: 'This item is not available right now.',
    },
  } as const;

  return reason ? messages[reason][locale] : '';
}
