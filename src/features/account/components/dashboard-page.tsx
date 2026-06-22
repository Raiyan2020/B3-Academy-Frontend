'use client';

import Link from 'next/link';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CreditCard,
  Heart,
  KeyRound,
  Library,
  LogOut,
  Newspaper,
  Plane,
  Settings,
  ShieldAlert,
  Stethoscope,
  UserRound,
  Video,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import {
  selectAccountBooks,
  selectAccountCourses,
  selectAccountNotifications,
  selectAccountPayments,
  selectAccountSubscription,
  selectAccountUpcomingAppointments,
  selectInProgressCourse,
} from '../services/account-selectors.service';
import { AccountShell, EmptyAccountState, InfoRow } from './account-shell';
import { useLanguage } from '../../../../LanguageContext';

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

export function Dashboard() {
  const { user } = useAuth();
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const courses = user ? selectAccountCourses(user.id, user.completedQuizIds || []) : [];
  const books = user ? selectAccountBooks(user.id) : [];
  const payments = user ? selectAccountPayments(user.id) : [];
  const notifications = user ? selectAccountNotifications(user.id) : [];
  const subscription = user ? selectAccountSubscription(user.id, user.subscriptionExpiryDate, user.isSubscribed) : { isActive: false };
  const upcoming = user ? selectAccountUpcomingAppointments(user.id) : { consultations: [], clinicBookings: [] };
  const inProgressCourse = user ? selectInProgressCourse(user.id, user.completedQuizIds || []) : null;
  const progressPercent = inProgressCourse && inProgressCourse.totalLessons > 0
    ? Math.round((inProgressCourse.completedLessons / inProgressCourse.totalLessons) * 100)
    : 0;

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
        <InfoRow label={isAr ? 'الدورات المسجلة' : 'Enrolled courses'} value={courses.length} />
        <InfoRow label={isAr ? 'الكتب المشتراة' : 'Purchased books'} value={books.length} />
        <InfoRow
          label={isAr ? 'الاشتراك' : 'Subscription'}
          value={
            subscription.isActive
              ? isAr
                ? `فعّال حتى ${user?.subscriptionExpiryDate ? new Date(user.subscriptionExpiryDate).toLocaleDateString('ar-EG') : 'غير محدد'}`
                : `Active until ${user?.subscriptionExpiryDate ? new Date(user.subscriptionExpiryDate).toLocaleDateString('en-US') : 'unknown'}`
              : isAr
                ? 'غير فعّال'
                : 'Inactive'
          }
        />
        <InfoRow label={isAr ? 'الإشعارات غير المقروءة' : 'Unread notifications'} value={notifications.filter((item) => !item.isRead).length} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-950">{isAr ? 'دورة قيد المتابعة' : 'Course in progress'}</h2>
          {inProgressCourse ? (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-slate-950">{localize(inProgressCourse.title)}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {isAr
                    ? `${inProgressCourse.completedLessons} من ${inProgressCourse.totalLessons} دروس مكتملة`
                    : `${inProgressCourse.completedLessons} of ${inProgressCourse.totalLessons} lessons completed`}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-sm font-semibold text-emerald-700">{progressPercent}%</p>
              <Link href={inProgressCourse.href} className="inline-flex text-sm font-semibold text-emerald-700">
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
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-md border border-slate-100 p-3 text-sm">
                  <p className="font-semibold text-slate-950">{notification.title}</p>
                  <p className="mt-1 line-clamp-2 text-slate-600">{notification.body}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</p>
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
          {upcoming.consultations.length > 0 || upcoming.clinicBookings.length > 0 ? (
            <div className="space-y-3 text-sm text-slate-700">
              {upcoming.consultations[0] && (
                <p>
                  {isAr ? 'استشارة' : 'Consultation'}: {localize(upcoming.consultations[0].serviceName)} - {upcoming.consultations[0].date} - {upcoming.consultations[0].time}
                </p>
              )}
              {upcoming.clinicBookings[0] && (
                <p>
                  {isAr ? 'عيادة' : 'Clinic'}: {localize(upcoming.clinicBookings[0].serviceName)} - {upcoming.clinicBookings[0].date} - {upcoming.clinicBookings[0].time}
                </p>
              )}
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
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="rounded-md border border-slate-100 p-3 text-sm">
                  <p className="font-semibold text-slate-950">{payment.itemName}</p>
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
