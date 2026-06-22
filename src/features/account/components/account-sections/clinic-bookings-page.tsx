'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { selectAccountClinicBookings } from '../../services/account-selectors.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function ClinicBookingsPage() {
  const { user } = useAuth();
  const bookings = user ? selectAccountClinicBookings(user.id) : [];
  const upcoming = bookings.filter((booking) => booking.isUpcoming);
  const past = bookings.filter((booking) => !booking.isUpcoming);

  const renderBooking = (booking: (typeof bookings)[number]) => (
    <article key={booking.id} className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="font-bold text-slate-950">{booking.serviceName.ar}</h2>
      <p className="mt-2 text-sm text-slate-600">
        {booking.doctorName.ar} - {booking.date} - {booking.time}
        {booking.duration ? ` (${booking.duration} د)` : ''}
      </p>
      <p className="text-sm text-slate-600">{booking.location}</p>
      {booking.clinicName && <p className="text-sm text-slate-600">{booking.clinicName.ar}</p>}
      <p className="mt-2 text-sm font-semibold">{booking.statusLabel}</p>
      {booking.paymentStatus && <p className="text-sm text-emerald-700">{booking.paymentStatus}</p>}
      {!booking.isAvailable && <p className="mt-1 text-sm text-amber-700">العيادة غير متاحة حالياً، لكن سجل الحجز محفوظ.</p>}
      <Link href={booking.href} className="mt-4 inline-flex rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700">عرض التفاصيل</Link>
    </article>
  );

  return (
    <AccountShell title="حجوزات العيادات" description="مواعيد العيادات المؤكدة والمدفوعة. لا يمكن تعديل أو إلغاء الحجز من الحساب.">
      {bookings.length === 0 ? (
        <EmptyAccountState title="لا توجد حجوزات عيادات" description="بعد تأكيد حجز عيادة سيظهر الموعد والفاتورة هنا." />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-bold text-slate-900">المواعيد القادمة</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-600">لا توجد مواعيد قادمة.</p>
            ) : (
              <div className="grid gap-4">{upcoming.map(renderBooking)}</div>
            )}
          </section>
          <section>
            <h2 className="mb-4 text-lg font-bold text-slate-900">المواعيد السابقة</h2>
            {past.length === 0 ? (
              <p className="text-sm text-slate-600">لا توجد مواعيد سابقة.</p>
            ) : (
              <div className="grid gap-4">{past.map(renderBooking)}</div>
            )}
          </section>
        </div>
      )}
    </AccountShell>
  );
}
