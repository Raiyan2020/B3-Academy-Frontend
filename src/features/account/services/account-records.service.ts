'use client';

import { updateAuthAccount } from '@/features/auth/auth-storage.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { FavoriteItem, HealthAssessmentRecord, NotificationItem } from '../types/account.types';

const FAVORITES_KEY = 'b3-account-favorites';
const NOTIFICATIONS_KEY = 'b3-account-notifications';
const HEALTH_ASSESSMENTS_KEY = 'b3-health-assessment-records';

export function getFavorites(userId?: string) {
  const all = readLocalStorageJson<FavoriteItem[]>(FAVORITES_KEY, []);
  return userId ? all.filter((item) => item.userId === userId) : all;
}

export function addFavorite(input: Omit<FavoriteItem, 'id'>) {
  const all = getFavorites();
  const existing = all.find((item) => item.userId === input.userId && item.kind === input.kind && item.itemId === input.itemId);
  if (existing) return existing;
  const favorite: FavoriteItem = {
    id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...input,
  };
  writeLocalStorageJson(FAVORITES_KEY, [favorite, ...all]);
  return favorite;
}

export function removeFavorite(favoriteId: string) {
  const all = getFavorites();
  writeLocalStorageJson(
    FAVORITES_KEY,
    all.filter((item) => item.id !== favoriteId),
  );
}

export function getNotifications(userId?: string) {
  const all = readLocalStorageJson<NotificationItem[]>(NOTIFICATIONS_KEY, []);
  if (all.length === 0 && userId) return seedNotifications(userId);
  return userId ? all.filter((item) => item.userId === userId) : all;
}

export function addNotification(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}) {
  const notification: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: input.userId,
    title: input.title,
    body: input.body,
    href: input.href,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  writeLocalStorageJson(NOTIFICATIONS_KEY, [notification, ...getNotifications()]);
  return notification;
}

export function markNotificationRead(notificationId: string) {
  const all = getNotifications();
  writeLocalStorageJson(
    NOTIFICATIONS_KEY,
    all.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
  );
}

export function markAllNotificationsRead(userId: string) {
  const all = getNotifications();
  writeLocalStorageJson(
    NOTIFICATIONS_KEY,
    all.map((item) => (item.userId === userId ? { ...item, isRead: true } : item)),
  );
}

export function deleteNotification(notificationId: string) {
  const all = getNotifications();
  writeLocalStorageJson(
    NOTIFICATIONS_KEY,
    all.filter((item) => item.id !== notificationId),
  );
}

export function deleteNotifications(notificationIds: string[]) {
  if (notificationIds.length === 0) return;
  const idSet = new Set(notificationIds);
  writeLocalStorageJson(
    NOTIFICATIONS_KEY,
    getNotifications().filter((item) => !idSet.has(item.id)),
  );
}

const RESOLVABLE_HREF_PREFIXES = [
  '/dashboard',
  '/courses',
  '/books',
  '/learn',
  '/read',
  '/clinic',
  '/consultation',
  '/trips',
  '/subscriptions',
  '/community',
  '/encyclopedia',
  '/monograph',
  '/checkout',
  '/health-assessment',
  '/faq',
  '/education',
  '/consultations',
  '/podcasts',
  '/',
];

export function isResolvableNotificationHref(href?: string) {
  if (!href || !href.startsWith('/')) return false;
  if (href === '/') return true;
  return RESOLVABLE_HREF_PREFIXES.filter((prefix) => prefix !== '/').some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`),
  );
}

export function getHealthAssessmentRecords(userId?: string) {
  const all = readLocalStorageJson<HealthAssessmentRecord[]>(HEALTH_ASSESSMENTS_KEY, []);
  return userId ? all.filter((item) => item.userId === userId) : all;
}

export function addHealthAssessmentRecord(
  userId: string,
  summary: string,
  answers?: Record<string, number>,
  additionalNotes?: string
) {
  const record: HealthAssessmentRecord = {
    id: `health-${Date.now()}`,
    userId,
    submittedAt: new Date().toISOString(),
    summary,
    answers,
    additionalNotes,
    adminNotified: true,
  };
  writeLocalStorageJson(HEALTH_ASSESSMENTS_KEY, [record, ...getHealthAssessmentRecords()]);
  updateAuthAccount(userId, { healthAssessmentCompleted: true });
  queueAdminHealthAssessmentNotification(userId, record.id);
  return record;
}

const ADMIN_HEALTH_QUEUE_KEY = 'b3-admin-health-assessment-queue';

function queueAdminHealthAssessmentNotification(userId: string, recordId: string) {
  const queue = readLocalStorageJson<Array<{ userId: string; recordId: string; notifiedAt: string }>>(ADMIN_HEALTH_QUEUE_KEY, []);
  writeLocalStorageJson(ADMIN_HEALTH_QUEUE_KEY, [
    { userId, recordId, notifiedAt: new Date().toISOString() },
    ...queue,
  ]);
}

function seedNotifications(userId: string) {
  const seeded: NotificationItem[] = [
    {
      id: 'notif-welcome',
      userId,
      title: 'مرحباً بك في B3 Academy',
      body: 'يمكنك متابعة مشترياتك وحجوزاتك واشتراكك من الحساب الشخصي.',
      href: '/dashboard',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ];
  writeLocalStorageJson(NOTIFICATIONS_KEY, seeded);
  return seeded;
}
