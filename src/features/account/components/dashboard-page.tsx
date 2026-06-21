'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { getBooks } from '@/features/books/services/books.service';
import { getCourses } from '@/features/courses/services/courses.service';
import { getPaymentRecords } from '@/features/payments/services/payments-storage.service';
import { getNotifications } from '../services/account-records.service';
import { AccountShell, EmptyAccountState, InfoRow } from './account-shell';

export function Dashboard() {
  const { user } = useAuth();
  const courses = user ? getCourses().filter((course) => user.purchasedCourseIds.includes(course.id)) : [];
  const books = user ? getBooks().filter((book) => user.purchasedBookIds.includes(book.id)) : [];
  const payments = user ? getPaymentRecords(user.id) : [];
  const notifications = user ? getNotifications(user.id) : [];
  const nextConsultation = user?.consultations?.find((item) => !item.isCompleted);
  const nextClinic = user?.clinicBookings?.find((item) => !item.isCompleted);

  return (
    <AccountShell title="الحساب الشخصي" description="ملخص سريع لنشاطك داخل المنصة بدون عرض بيانات افتراضية عند عدم وجود نشاط.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoRow label="الدورات المسجلة" value={courses.length} />
        <InfoRow label="الكتب المشتراة" value={books.length} />
        <InfoRow label="الاشتراك" value={user?.isSubscribed ? `فعّال حتى ${new Date(user.subscriptionExpiryDate || '').toLocaleDateString('ar-EG')}` : 'غير فعّال'} />
        <InfoRow label="الإشعارات غير المقروءة" value={notifications.filter((item) => !item.isRead).length} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-950">أقرب موعد</h2>
          {nextConsultation || nextClinic ? (
            <div className="space-y-3 text-sm text-slate-700">
              {nextConsultation && (
                <p>
                  استشارة: {nextConsultation.serviceName.ar} - {nextConsultation.date} - {nextConsultation.time}
                </p>
              )}
              {nextClinic && (
                <p>
                  عيادة: {nextClinic.serviceName.ar} - {nextClinic.date} - {nextClinic.time}
                </p>
              )}
            </div>
          ) : (
            <EmptyAccountState title="لا توجد مواعيد قادمة" description="لن نعرض موعداً افتراضياً غير موجود في حسابك." />
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-950">أحدث المدفوعات</h2>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="rounded-md border border-slate-100 p-3 text-sm">
                  <p className="font-semibold text-slate-950">{payment.itemName}</p>
                  <p className="text-slate-500">
                    {payment.amount} {payment.currency} - {payment.status}
                  </p>
                </div>
              ))}
              <Link href="/dashboard/payments" className="inline-flex text-sm font-semibold text-emerald-700">
                عرض سجل المدفوعات
              </Link>
            </div>
          ) : (
            <EmptyAccountState title="لا توجد مدفوعات" description="ستظهر عمليات الدفع الناجحة أو الفاشلة هنا بعد تنفيذها." />
          )}
        </section>
      </div>
    </AccountShell>
  );
}

export { Dashboard as DashboardPage };

