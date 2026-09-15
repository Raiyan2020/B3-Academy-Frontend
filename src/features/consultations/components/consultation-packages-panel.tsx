'use client';

import { useState } from 'react';
import {
  useAccountConsultationPackage,
  useAccountConsultationPackages,
} from '../hooks/use-account-consultations';

function PackageDetails({ orderId }: { orderId: string }) {
  const [expanded, setExpanded] = useState(false);
  const detailQuery = useAccountConsultationPackage(orderId, expanded);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        {expanded ? 'إخفاء الجلسات' : 'عرض الجلسات'}
      </button>
      {expanded && (
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          {detailQuery.isLoading ? (
            <p>جار تحميل الجلسات...</p>
          ) : detailQuery.error ? (
            <p className="text-red-600">تعذر تحميل تفاصيل الباقة.</p>
          ) : detailQuery.data?.sessions.length ? (
            detailQuery.data.sessions.map((session) => (
              <div key={session.id} className="rounded-md bg-slate-50 p-2">
                <span className="font-semibold">{session.bookingTypeLabel}</span>
                {' · '}
                {[session.appointmentDate, session.startTime].filter(Boolean).join(' ')}
                {' · '}
                {session.statusLabel}
              </div>
            ))
          ) : (
            <p>لا توجد جلسات مسجلة بعد.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ConsultationPackagesPanel({ enabled }: { enabled: boolean }) {
  const packagesQuery = useAccountConsultationPackages({ perPage: 50, enabled });
  const packages = packagesQuery.data?.items ?? [];

  if (!enabled || packagesQuery.isLoading || packages.length === 0) return null;

  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <h2 className="font-bold text-slate-950">باقات الاستشارات</h2>
      <div className="mt-4 grid gap-3">
        {packages.map((item) => (
          <article key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{item.packageName}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.statusLabel}</p>
              </div>
              <p className="font-semibold text-emerald-700">{item.amount} {item.currency}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              الجلسات المتبقية: {item.remainingSessionsCount} من {item.totalSessionsCount}
            </p>
            <PackageDetails orderId={item.id} />
          </article>
        ))}
      </div>
    </section>
  );
}
