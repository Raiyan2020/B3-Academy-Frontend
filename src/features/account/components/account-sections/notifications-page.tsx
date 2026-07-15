'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { selectAccountNotifications } from '../../services/account-selectors.service';
import {
  deleteNotifications,
  isResolvableNotificationHref,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/account-records.service';
import { AccountShell, EmptyAccountState } from '../account-shell';
import { useLanguage } from '../../../../../LanguageContext';
import { useBackendNotificationActions, useBackendNotifications } from '../../hooks/use-account-api';

export function NotificationsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [version, setVersion] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const backendNotifications = useBackendNotifications();
  const backendActions = useBackendNotificationActions();
  const localNotifications = user ? selectAccountNotifications(user.id) : [];
  const hasBackendNotifications = Boolean(backendNotifications.data?.items.length);
  const notifications = hasBackendNotifications
    ? backendNotifications.data!.items.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        createdAt: item.createdAt || new Date().toISOString(),
        isRead: item.isRead,
        href: item.href,
      }))
    : localNotifications;

  const refresh = () => {
    setVersion((v) => v + 1);
    setSelectedIds([]);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((item) => item.id));
    }
  };

  return (
    <AccountShell
      title={isAr ? 'الإشعارات' : 'Notifications'}
      description={
        isAr
          ? 'إدارة الإشعارات المقروءة وغير المقروءة والروابط المرتبطة بها.'
          : 'Manage read and unread notifications and their linked destinations.'
      }
    >
      {user && notifications.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (hasBackendNotifications) {
                void backendActions.markAllRead.mutateAsync().then(refresh);
              } else {
                markAllNotificationsRead(user.id);
                refresh();
              }
            }}
            className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700"
          >
            {isAr ? 'تعليم الكل كمقروء' : 'Mark all as read'}
          </button>
          {hasBackendNotifications && (
            <>
              <button
                onClick={() => void backendActions.toggle.mutateAsync()}
                disabled={backendActions.toggle.isPending}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                {isAr ? 'تبديل استقبال الإشعارات' : 'Toggle notifications'}
              </button>
              <button
                onClick={() => void backendActions.clearAll.mutateAsync().then(refresh)}
                disabled={backendActions.clearAll.isPending}
                className="rounded-md border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
              >
                {isAr ? 'حذف كل الإشعارات' : 'Clear all'}
              </button>
            </>
          )}
          <button
            onClick={toggleAll}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {selectedIds.length === notifications.length
              ? isAr ? 'إلغاء التحديد' : 'Clear selection'
              : isAr ? 'تحديد الكل' : 'Select all'}
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                if (hasBackendNotifications) {
                  void backendActions.deleteMany.mutateAsync(selectedIds).then(refresh);
                } else {
                  deleteNotifications(selectedIds);
                  refresh();
                }
              }}
              className="rounded-md border border-red-600 px-4 py-2 text-sm font-semibold text-red-600"
            >
              {isAr ? `حذف المحدد (${selectedIds.length})` : `Delete selected (${selectedIds.length})`}
            </button>
          )}
        </div>
      )}
      {notifications.length === 0 ? (
        <EmptyAccountState
          title={isAr ? 'لا توجد إشعارات' : 'No notifications'}
          description={isAr ? 'ستظهر إشعارات المنصة هنا عند توفرها.' : 'Platform notifications will appear here when available.'}
        />
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => {
            const hrefResolvable = isResolvableNotificationHref(notification.href);
            return (
              <article key={`${notification.id}-${version}`} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(notification.id)}
                    onChange={() => toggleSelected(notification.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700"
                    aria-label={isAr ? 'تحديد الإشعار' : 'Select notification'}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-bold text-slate-950">{notification.title}</h2>
                        <p className="mt-2 text-sm text-slate-600">{notification.body}</p>
                        <p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</p>
                      </div>
                      {!notification.isRead && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          {isAr ? 'غير مقروء' : 'Unread'}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {notification.href && hrefResolvable && (
                        <Link
                          onClick={() => {
                            if (hasBackendNotifications) void backendActions.markRead.mutateAsync(notification.id);
                            else markNotificationRead(notification.id);
                          }}
                          href={notification.href}
                          className="text-sm font-semibold text-emerald-700"
                        >
                          {isAr ? 'فتح الرابط' : 'Open link'}
                        </Link>
                      )}
                      {notification.href && !hrefResolvable && (
                        <span className="text-sm font-semibold text-amber-700">
                          {isAr ? 'الرابط غير متاح — اقرأ المحتوى أعلاه' : 'Link unavailable — read the content above'}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          if (hasBackendNotifications) {
                            void backendActions.markRead.mutateAsync(notification.id).then(refresh);
                          } else {
                            markNotificationRead(notification.id);
                            refresh();
                          }
                        }}
                        className="text-sm font-semibold text-slate-700"
                      >
                        {isAr ? 'تعليم كمقروء' : 'Mark as read'}
                      </button>
                      {hasBackendNotifications && (
                        <button
                          onClick={() => void backendActions.delete.mutateAsync(notification.id).then(refresh)}
                          disabled={backendActions.delete.isPending}
                          className="text-sm font-semibold text-red-600 disabled:opacity-50"
                        >
                          {isAr ? 'حذف' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
