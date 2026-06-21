'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/account-records.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function NotificationsPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const notifications = user ? getNotifications(user.id) : [];

  return (
    <AccountShell title="الإشعارات" description="إدارة الإشعارات المقروءة وغير المقروءة والروابط المرتبطة بها.">
      {user && notifications.length > 0 && (
        <button onClick={() => { markAllNotificationsRead(user.id); setVersion(version + 1); }} className="mb-4 rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700">
          تعليم الكل كمقروء
        </button>
      )}
      {notifications.length === 0 ? (
        <EmptyAccountState title="لا توجد إشعارات" description="ستظهر إشعارات المنصة هنا عند توفرها." />
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <article key={notification.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-950">{notification.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{notification.body}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString('ar-EG')}</p>
                </div>
                {!notification.isRead && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">غير مقروء</span>}
              </div>
              <div className="mt-4 flex gap-3">
                {notification.href && <Link onClick={() => markNotificationRead(notification.id)} href={notification.href} className="text-sm font-semibold text-emerald-700">فتح الرابط</Link>}
                <button onClick={() => { markNotificationRead(notification.id); setVersion(version + 1); }} className="text-sm font-semibold text-slate-700">تعليم كمقروء</button>
                <button onClick={() => { deleteNotification(notification.id); setVersion(version + 1); }} className="text-sm font-semibold text-red-600">حذف</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}

