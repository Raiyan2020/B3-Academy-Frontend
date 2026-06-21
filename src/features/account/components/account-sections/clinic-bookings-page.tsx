'use client';

import { useAuth } from '@/features/auth/auth-provider';
import { getStoredClinicBookings } from '@/features/care/services/care-records-storage.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function ClinicBookingsPage() {
  const { user } = useAuth();
  const storedBookings = user ? getStoredClinicBookings(user.id) : [];
  const mockBookings = user?.clinicBookings || [];
  const bookings = [
    ...storedBookings.map((booking) => ({
      id: booking.id,
      serviceName: booking.serviceName,
      date: booking.date,
      time: booking.time,
      location: booking.location,
      isCompleted: booking.status === 'completed',
      statusLabel: booking.status === 'scheduled' ? 'موعد قادم' : booking.status,
    })),
    ...mockBookings.map((booking) => ({
      ...booking,
      statusLabel: booking.isCompleted ? 'تم الموعد' : 'موعد قادم',
    })),
  ];

  return (
    <AccountShell title="حجوزات العيادات" description="مواعيد العيادات المؤكدة والمدفوعة. لا يمكن تعديل أو إلغاء الحجز من الحساب.">
      {bookings.length === 0 ? (
        <EmptyAccountState title="لا توجد حجوزات عيادات" description="بعد تأكيد حجز عيادة سيظهر الموعد والفاتورة هنا." />
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">{booking.serviceName.ar}</h2>
              <p className="mt-2 text-sm text-slate-600">{booking.date} - {booking.time}</p>
              <p className="text-sm text-slate-600">{booking.location}</p>
              <p className="mt-2 text-sm font-semibold">{booking.statusLabel}</p>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
