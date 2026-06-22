'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { selectAccountConsultations, selectAccountPackageSessions } from '../../services/account-selectors.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function MyConsultationsPage() {
  const { user } = useAuth();
  const consultations = user ? selectAccountConsultations(user.id) : [];
  const upcoming = consultations.filter((item) => item.isUpcoming);
  const past = consultations.filter((item) => !item.isUpcoming);

  const renderConsultation = (item: (typeof consultations)[number]) => {
    const sessions = item.packageId && user ? selectAccountPackageSessions(user.id, item.packageId) : [];
    return (
      <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-950">{item.serviceName.ar}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {item.doctorName.ar} - {item.date} - {item.time}
          {item.duration ? ` (${item.duration} د)` : ''}
        </p>
        <p className="mt-2 text-sm font-semibold">{item.statusLabel}</p>
        {item.portalState && item.kind !== 'package' && (
          <p className="mt-1 text-xs text-slate-500">حالة البوابة: {item.portalState}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={item.detailHref} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">تفاصيل الاستشارة</Link>
          {item.portalHref && (item.portalState === 'open' || item.portalState === 'prep_only') && (
            <Link href={item.portalHref} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">دخول بوابة المحادثة</Link>
          )}
        </div>
        {sessions.length > 0 && (
          <div className="mt-4 rounded-md bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">جلسات الباقة المحجوزة</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {sessions.map((session) => (
                <li key={session.id}>
                  {session.date} - {session.time} ({session.sessionFormat})
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    );
  };

  return (
    <AccountShell title="استشاراتي وباقات الاستشارات" description="الاستشارات الفردية، الأولية، وبوابات تنفيذ الجلسات.">
      {consultations.length === 0 ? (
        <EmptyAccountState title="لا توجد استشارات" description="بعد حجز استشارة أو شراء باقة ستظهر الجلسات هنا." />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-bold text-slate-900">القادمة</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-600">لا توجد استشارات قادمة.</p>
            ) : (
              <div className="grid gap-4">{upcoming.map(renderConsultation)}</div>
            )}
          </section>
          <section>
            <h2 className="mb-4 text-lg font-bold text-slate-900">السابقة</h2>
            {past.length === 0 ? (
              <p className="text-sm text-slate-600">لا توجد استشارات سابقة.</p>
            ) : (
              <div className="grid gap-4">{past.map(renderConsultation)}</div>
            )}
          </section>
        </div>
      )}
    </AccountShell>
  );
}
