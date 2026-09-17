'use client';

import Link from 'next/link';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CreditCard,
  Heart,
  Library,
  LogOut,
  Newspaper,
  Plane,
  Settings,
  ShieldAlert,
  Stethoscope,
  Video,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { useMyCourseApiList } from '@/features/courses/hooks/use-course-api';
import { useMyBooks } from '@/features/books/hooks/use-books-api';
import { usePortalList } from '@/features/consultations/hooks/use-care-portal';
import { useMySubscription } from '@/features/subscriptions/hooks/use-subscriptions';
import { useAccountPayments } from '../hooks/use-account-payments';
import { useBackendNotifications, useBackendUnreadNotificationCount } from '../hooks/use-account-api';
import { AccountShell, EmptyAccountState, InfoRow } from './account-shell';
import { useLanguage } from '@/LanguageContext';

const quickLinks = [
  { href: '/dashboard/profile', label: { ar: 'البيانات الشخصية', en: 'Profile' }, icon: Settings },
  { href: '/dashboard/courses', label: { ar: 'دوراتي', en: 'My courses' }, icon: BookOpen },
  { href: '/dashboard/books', label: { ar: 'كتبي', en: 'My books' }, icon: Library },
  { href: '/dashboard/consultations', label: { ar: 'استشاراتي', en: 'Consultations' }, icon: Video },
  { href: '/dashboard/clinic-bookings', label: { ar: 'حجوزات العيادات', en: 'Clinic bookings' }, icon: Stethoscope },
  { href: '/dashboard/trips', label: { ar: 'رحلاتي', en: 'My trips' }, icon: Plane },
  { href: '/dashboard/subscription', label: { ar: 'اشتراكي', en: 'Subscription' }, icon: CalendarDays },
  { href: '/dashboard/payments', label: { ar: 'المدفوعات', en: 'Payments' }, icon: CreditCard },
  { href: '/dashboard/health-assessments', label: { ar: 'التقييمات الصحية', en: 'Health assessments' }, icon: ShieldAlert },
  { href: '/dashboard/favorites', label: { ar: 'المفضلة', en: 'Favorites' }, icon: Heart },
  { href: '/dashboard/notifications', label: { ar: 'الإشعارات', en: 'Notifications' }, icon: Bell },
  { href: '/dashboard/newsletter', label: { ar: 'النشرة', en: 'Newsletter' }, icon: Newspaper },
  { href: '/dashboard/security', label: { ar: 'الأمان', en: 'Security' }, icon: LogOut },
];

function LoadingCard({ isAr }: { isAr: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      {isAr ? 'جاري التحميل...' : 'Loading...'}
    </div>
  );
}

function ErrorCard({ isAr, message }: { isAr: boolean; message?: string }) {
  return (
    <div className="rounded-lg border border-red-100 bg-white p-8 text-center text-sm font-semibold text-red-700">
      {message || (isAr ? 'تعذر تحميل هذا القسم.' : 'This section failed to load.')}
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const hasUser = Boolean(user);

  const coursesQuery = useMyCourseApiList(hasUser);
  const booksQuery = useMyBooks();
  const notificationsQuery = useBackendNotifications();
  const unreadCountQuery = useBackendUnreadNotificationCount();
  const subscriptionQuery = useMySubscription();
  const paymentsQuery = useAccountPayments({ page: 1 });
  const clinicAppointmentsQuery = usePortalList('clinic-appointments', { perPage: 50, enabled: hasUser });
  const clinicInitialConsultationsQuery = usePortalList('clinic-initial-consultations', { perPage: 50, enabled: hasUser });
  const consultationsQuery = usePortalList('account/consultations', { perPage: 50, enabled: hasUser });

  const courses = coursesQuery.data || [];
  const inProgressCourse = courses.find((c) => !c.isCompleted && c.progressPercent > 0)
    || courses.find((c) => !c.isCompleted)
    || null;

  const notifications = notificationsQuery.isSuccess ? notificationsQuery.data.items : [];

  const payments = paymentsQuery.data?.items ?? [];

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcomingAppointments = [
    ...(clinicAppointmentsQuery.data?.items ?? []),
    ...(clinicInitialConsultationsQuery.data?.items ?? []),
    ...(consultationsQuery.data?.items ?? []),
  ]
    .filter((item) => item.status === 'confirmed' && item.appointmentDate && item.appointmentDate >= todayIso)
    .sort((a, b) => `${a.appointmentDate}${a.startTime ?? ''}`.localeCompare(`${b.appointmentDate}${b.startTime ?? ''}`));
  const nextAppointment = upcomingAppointments[0];
  const appointmentsLoading = clinicAppointmentsQuery.isLoading || clinicInitialConsultationsQuery.isLoading || consultationsQuery.isLoading;
  const appointmentsError = clinicAppointmentsQuery.isError || clinicInitialConsultationsQuery.isError || consultationsQuery.isError;

  return (
    <AccountShell
      title={isAr ? 'الحساب الشخصي' : 'Account home'}
      description={
        isAr
          ? 'ملخص سريع لنشاطك داخل المنصة بدون عرض بيانات افتراضية عند عدم وجود نشاط.'
          : 'A quick overview of your platform activity with real empty states when there is no data.'
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoRow
          label={isAr ? 'الدورات المسجلة' : 'Enrolled courses'}
          value={coursesQuery.isLoading ? '...' : coursesQuery.isError ? (isAr ? 'خطأ' : 'Error') : courses.length}
        />
        <InfoRow
          label={isAr ? 'الكتب المشتراة' : 'Purchased books'}
          value={booksQuery.isLoading ? '...' : booksQuery.isError ? (isAr ? 'خطأ' : 'Error') : (booksQuery.data ?? []).length}
        />
        <InfoRow
          label={isAr ? 'الاشتراك' : 'Subscription'}
          value={
            subscriptionQuery.isLoading
              ? '...'
              : subscriptionQuery.isError
                ? (isAr ? 'خطأ' : 'Error')
                : subscriptionQuery.data?.active
                  ? isAr
                    ? `فعّال حتى ${subscriptionQuery.data.active.endsAt || 'غير محدد'}`
                    : `Active until ${subscriptionQuery.data.active.endsAt || 'unknown'}`
                  : isAr ? 'غير فعّال' : 'Inactive'
          }
        />
        <InfoRow
          label={isAr ? 'الإشعارات غير المقروءة' : 'Unread notifications'}
          value={unreadCountQuery.isLoading ? '...' : unreadCountQuery.isError ? (isAr ? 'خطأ' : 'Error') : (unreadCountQuery.data ?? 0)}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-950">{isAr ? 'دورة قيد المتابعة' : 'Course in progress'}</h2>
          {coursesQuery.isLoading ? (
            <LoadingCard isAr={isAr} />
          ) : coursesQuery.isError ? (
            <ErrorCard isAr={isAr} />
          ) : inProgressCourse ? (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-slate-950">{inProgressCourse.course.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {isAr ? `${Math.round(inProgressCourse.progressPercent)}% مكتمل` : `${Math.round(inProgressCourse.progressPercent)}% completed`}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${inProgressCourse.progressPercent}%` }} />
              </div>
              <Link href={`/learn/${inProgressCourse.enrollmentId}`} className="inline-flex text-sm font-semibold text-emerald-700">
                {isAr ? 'متابعة التعلم' : 'Continue learning'}
              </Link>
            </div>
          ) : (
            <EmptyAccountState
              title={isAr ? 'لا توجد دورة قيد المتابعة' : 'No course in progress'}
              description={isAr ? 'ستظهر هنا الدورة التي بدأت متابعتها.' : 'A course you started will appear here.'}
            />
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">{isAr ? 'أحدث الإشعارات' : 'Latest notifications'}</h2>
            <Link href="/dashboard/notifications" className="text-sm font-semibold text-emerald-700">
              {isAr ? 'عرض الكل' : 'View all'}
            </Link>
          </div>
          {notificationsQuery.isLoading ? (
            <LoadingCard isAr={isAr} />
          ) : notificationsQuery.isError ? (
            <ErrorCard isAr={isAr} />
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-md border border-slate-100 p-3 text-sm">
                  <p className="font-semibold text-slate-950">{notification.title}</p>
                  <p className="mt-1 line-clamp-2 text-slate-600">{notification.body}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')
                      : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyAccountState
              title={isAr ? 'لا توجد إشعارات' : 'No notifications'}
              description={isAr ? 'ستظهر إشعارات المنصة هنا عند توفرها.' : 'Platform notifications will appear here when available.'}
            />
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-950">{isAr ? 'أقرب موعد' : 'Next appointment'}</h2>
          {appointmentsLoading ? (
            <LoadingCard isAr={isAr} />
          ) : appointmentsError ? (
            <ErrorCard isAr={isAr} />
          ) : nextAppointment ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">{nextAppointment.bookingTypeLabel}</p>
              <p>
                {[nextAppointment.appointmentDate, nextAppointment.startTime].filter(Boolean).join(' - ')}
              </p>
              <p className="font-semibold text-emerald-700">{nextAppointment.statusLabel}</p>
            </div>
          ) : (
            <EmptyAccountState
              title={isAr ? 'لا توجد مواعيد قادمة' : 'No upcoming appointments'}
              description={isAr ? 'لن نعرض موعداً افتراضياً غير موجود في حسابك.' : 'We will not show placeholder appointments that are not in your account.'}
            />
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-950">{isAr ? 'أحدث المدفوعات' : 'Recent payments'}</h2>
          {paymentsQuery.isLoading ? (
            <LoadingCard isAr={isAr} />
          ) : paymentsQuery.isError ? (
            <ErrorCard isAr={isAr} />
          ) : payments.length > 0 ? (
            <div className="space-y-3">
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="rounded-md border border-slate-100 p-3 text-sm">
                  <p className="font-semibold text-slate-950">{payment.contentName || payment.typeLabel}</p>
                  <p className="text-slate-500">
                    {payment.amount} {payment.currency} - {payment.statusLabel}
                  </p>
                </div>
              ))}
              <Link href="/dashboard/payments" className="inline-flex text-sm font-semibold text-emerald-700">
                {isAr ? 'عرض سجل المدفوعات' : 'View payment history'}
              </Link>
            </div>
          ) : (
            <EmptyAccountState
              title={isAr ? 'لا توجد مدفوعات' : 'No payments'}
              description={isAr ? 'ستظهر عمليات الدفع الناجحة أو الفاشلة هنا بعد تنفيذها.' : 'Successful or failed payments will appear here after checkout.'}
            />
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-slate-950">{isAr ? 'اختصارات الحساب' : 'Account quick links'}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <link.icon className="h-4 w-4 shrink-0" />
              <span>{isAr ? link.label.ar : link.label.en}</span>
            </Link>
          ))}
        </div>
      </section>
    </AccountShell>
  );
}

export { Dashboard as DashboardPage };
