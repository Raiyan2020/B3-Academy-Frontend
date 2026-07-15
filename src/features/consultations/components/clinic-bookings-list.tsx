'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { AccountShell, EmptyAccountState } from '@/features/account/components/account-shell';
import { usePortalList } from '../hooks/use-care-portal';
import type { CareBookingListItem, CarePortalResource } from '../types/api.types';

type Row = CareBookingListItem & { resource: CarePortalResource };

export function ClinicBookingsList() {
  const { user } = useAuth();
  const enabled = Boolean(user);
  const appointmentsQuery = usePortalList('clinic-appointments', { perPage: 50, enabled });
  const initialConsultationsQuery = usePortalList('clinic-initial-consultations', { perPage: 50, enabled });

  const isLoading = appointmentsQuery.isLoading || initialConsultationsQuery.isLoading;
  const isError = Boolean(appointmentsQuery.error && initialConsultationsQuery.error);

  const rows: Row[] = [
    ...(appointmentsQuery.data?.items ?? []).map((item) => ({ ...item, resource: 'clinic-appointments' as const })),
    ...(initialConsultationsQuery.data?.items ?? []).map((item) => ({ ...item, resource: 'clinic-initial-consultations' as const })),
  ];

  const renderBooking = (booking: Row) => (
    <article key={`${booking.resource}-${booking.id}`} className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="font-bold text-slate-950">{booking.bookingTypeLabel}</h2>
      <p className="mt-2 text-sm text-slate-600">
        {[booking.appointmentDate, booking.startTime].filter(Boolean).join(' - ') || 'غير محدد'}
      </p>
      <p className="mt-2 text-sm font-semibold">{booking.statusLabel}</p>
      {booking.paymentStatusLabel && <p className="text-sm text-emerald-700">{booking.paymentStatusLabel}</p>}
      <Link
        href={`/clinic-booking/${booking.id}?resource=${booking.resource}`}
        className="mt-4 inline-flex rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700"
      >
        عرض التفاصيل
      </Link>
    </article>
  );

  return (
    <AccountShell title="حجوزات العيادات" description="مواعيد العيادات والاستشارات الأولية المؤكدة والمدفوعة.">
      {isLoading ? (
        <p className="text-sm text-slate-600">جار التحميل...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">تعذر تحميل الحجوزات.</p>
      ) : rows.length === 0 ? (
        <EmptyAccountState title="لا توجد حجوزات عيادات" description="بعد تأكيد حجز عيادة سيظهر الموعد والفاتورة هنا." />
      ) : (
        <div className="grid gap-4">{rows.map(renderBooking)}</div>
      )}
    </AccountShell>
  );
}
