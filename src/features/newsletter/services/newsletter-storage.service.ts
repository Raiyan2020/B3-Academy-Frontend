'use client';

import { addNotification } from '@/features/account/services/account-records.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { NewsletterSubscription } from '../types/newsletter.types';

const NEWSLETTER_KEY = 'b3-newsletter-subscriptions';

export function getNewsletterSubscriptions(userId?: string) {
  const all = readLocalStorageJson<NewsletterSubscription[]>(NEWSLETTER_KEY, []);
  return userId ? all.filter((item) => item.userId === userId) : all;
}

export function getLatestNewsletterSubscription(userId: string) {
  return getNewsletterSubscriptions(userId)[0] || null;
}

export function requestNewsletterSubscription(userId: string, email: string) {
  const existing = getLatestNewsletterSubscription(userId);
  if (existing && existing.email === email && existing.status !== 'unsubscribed') return existing;

  const record: NewsletterSubscription = {
    id: `newsletter-${Date.now()}`,
    userId,
    email,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  writeLocalStorageJson(NEWSLETTER_KEY, [record, ...getNewsletterSubscriptions()]);
  addNotification({
    userId,
    title: 'تأكيد النشرة الإلكترونية',
    body: `تم إرسال طلب تأكيد النشرة إلى ${email}.`,
    href: '/dashboard/newsletter',
  });
  return record;
}

export function confirmNewsletterSubscription(userId: string) {
  return updateLatestNewsletter(userId, (record) => ({
    ...record,
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
  }));
}

export function unsubscribeNewsletter(userId: string) {
  return updateLatestNewsletter(userId, (record) => ({
    ...record,
    status: 'unsubscribed',
    unsubscribedAt: new Date().toISOString(),
  }));
}

function updateLatestNewsletter(
  userId: string,
  update: (record: NewsletterSubscription) => NewsletterSubscription,
) {
  const all = getNewsletterSubscriptions();
  let updated: NewsletterSubscription | null = null;
  const next = all.map((record) => {
    if (!updated && record.userId === userId) {
      updated = update(record);
      return updated;
    }
    return record;
  });
  writeLocalStorageJson(NEWSLETTER_KEY, next);
  return updated;
}
