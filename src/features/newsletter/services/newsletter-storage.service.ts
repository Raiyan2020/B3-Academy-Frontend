'use client';

import { addNotification } from '@/features/account/services/account-records.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { NewsletterSubscription } from '../types/newsletter.types';

const NEWSLETTER_KEY = 'b3-newsletter-subscriptions';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NEWSLETTER_MESSAGES = {
  invalidEmail: {
    ar: 'يرجى إدخال بريد إلكتروني صالح (مثال: name@example.com).',
    en: 'Please enter a valid email address (e.g. name@example.com).',
  },
  alreadySubscribed: {
    ar: 'هذا البريد الإلكتروني مشترك بالفعل في النشرة.',
    en: 'This email address is already subscribed to the newsletter.',
  },
} as const;

export function isValidNewsletterEmail(email: string) {
  return EMAIL_PATTERN.test(email.trim());
}

export function getNewsletterSubscriptions(userId?: string) {
  const all = readLocalStorageJson<NewsletterSubscription[]>(NEWSLETTER_KEY, []);
  return userId ? all.filter((item) => item.userId === userId) : all;
}

export function getLatestNewsletterSubscription(userId: string) {
  return getNewsletterSubscriptions(userId)[0] || null;
}

export function findNewsletterByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return (
    getNewsletterSubscriptions().find(
      (item) => item.email.trim().toLowerCase() === normalized && item.status !== 'unsubscribed',
    ) || null
  );
}

export type NewsletterRequestResult =
  | { ok: true; record: NewsletterSubscription }
  | { ok: false; code: 'invalid_email' | 'duplicate'; message: { ar: string; en: string } };

export function requestNewsletterSubscription(userId: string, email: string): NewsletterRequestResult {
  const trimmed = email.trim();
  if (!isValidNewsletterEmail(trimmed)) {
    return { ok: false, code: 'invalid_email', message: NEWSLETTER_MESSAGES.invalidEmail };
  }

  const globalDuplicate = findNewsletterByEmail(trimmed);
  if (globalDuplicate) {
    return { ok: false, code: 'duplicate', message: NEWSLETTER_MESSAGES.alreadySubscribed };
  }

  const existing = getLatestNewsletterSubscription(userId);
  if (existing && existing.email === trimmed && existing.status !== 'unsubscribed') {
    return { ok: true, record: existing };
  }

  const record: NewsletterSubscription = {
    id: `newsletter-${Date.now()}`,
    userId,
    email: trimmed,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  writeLocalStorageJson(NEWSLETTER_KEY, [record, ...getNewsletterSubscriptions()]);
  addNotification({
    userId,
    title: 'تأكيد النشرة الإلكترونية',
    body: `تم إرسال طلب تأكيد النشرة إلى ${trimmed}.`,
    href: '/dashboard/newsletter',
  });
  return { ok: true, record };
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

export interface NewsletterCampaign {
  id: string;
  subject: { ar: string; en: string };
  body: { ar: string; en: string };
  sentAt: string;
  recipientCount: number;
}

const CAMPAIGNS_KEY = 'b3-newsletter-campaigns';

export function listNewsletterCampaigns(): NewsletterCampaign[] {
  return readLocalStorageJson<NewsletterCampaign[]>(CAMPAIGNS_KEY, []);
}

export function sendNewsletterCampaign(input: { subject: { ar: string; en: string }; body: { ar: string; en: string } }) {
  const confirmed = getNewsletterSubscriptions().filter((item) => item.status === 'confirmed');
  const campaign: NewsletterCampaign = {
    id: `campaign-${Date.now()}`,
    subject: input.subject,
    body: input.body,
    sentAt: new Date().toISOString(),
    recipientCount: confirmed.length,
  };
  writeLocalStorageJson(CAMPAIGNS_KEY, [campaign, ...listNewsletterCampaigns()]);
  return campaign;
}
