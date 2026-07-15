'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { AccountShell, EmptyAccountState } from '@/features/account/components/account-shell';
import { usePortalList } from '../hooks/use-care-portal';
import type { CareBookingListItem } from '../types/api.types';

const RESOURCE = 'individual-consultations' as const;

export function ConsultationsList() {
  const { user } = useAuth();
  const listQuery = usePortalList(RESOURCE, { perPage: 50, enabled: Boolean(user) });
  const consultations = listQuery.data?.items ?? [];

  const renderConsultation = (item: CareBookingListItem) => (
    <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="font-bold text-slate-950">{item.bookingTypeLabel}</h2>
      <p className="mt-2 text-sm text-slate-600">
        {[item.appointmentDate, item.startTime].filter(Boolean).join(' - ') || 'غير محدد'}
      </p>
      <p className="mt-2 text-sm font-semibold">{item.statusLabel}</p>
      {item.paymentStatusLabel && <p className="text-sm text-emerald-700">{item.paymentStatusLabel}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/consultation/${item.id}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
          تفاصيل الاستشارة
        </Link>
        {item.bookingType.includes('text') && (
          <Link href={`/consultation/${item.id}/chat`} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
            دخول بوابة المحادثة
          </Link>
        )}
      </div>
    </article>
  );

  return (
    <AccountShell title="استشاراتي" description="الاستشارات الفردية وبوابات تنفيذ الجلسات.">
      {listQuery.isLoading ? (
        <p className="text-sm text-slate-600">جار التحميل...</p>
      ) : listQuery.error ? (
        <p className="text-sm text-red-600">تعذر تحميل الاستشارات.</p>
      ) : consultations.length === 0 ? (
        <EmptyAccountState title="لا توجد استشارات" description="بعد حجز استشارة ستظهر الجلسات هنا." />
      ) : (
        <div className="grid gap-4">{consultations.map(renderConsultation)}</div>
      )}
    </AccountShell>
  );
}
