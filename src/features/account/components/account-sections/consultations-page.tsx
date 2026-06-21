'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { getStoredConsultations } from '@/features/care/services/care-records-storage.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function MyConsultationsPage() {
  const { user } = useAuth();
  const mockConsultations = user?.consultations || [];
  const storedConsultations = user ? getStoredConsultations(user.id) : [];
  const consultations = [
    ...storedConsultations.map((item) => ({
      id: item.id,
      serviceName: item.serviceName,
      instructorName: item.doctorName,
      date: item.date,
      time: item.time,
      isCompleted: item.status === 'completed',
      chatLink: item.portalHref,
      statusLabel: item.status === 'purchased' ? 'باقة مشتراة' : item.status === 'scheduled' ? 'قادمة' : item.status,
    })),
    ...mockConsultations.map((item) => ({ ...item, statusLabel: item.isCompleted ? 'مكتملة' : 'قادمة' })),
  ];

  return (
    <AccountShell title="استشاراتي وباقات الاستشارات" description="الاستشارات الفردية، الأولية، وبوابات تنفيذ الجلسات.">
      {consultations.length === 0 ? (
        <EmptyAccountState title="لا توجد استشارات" description="بعد حجز استشارة أو شراء باقة ستظهر الجلسات هنا." />
      ) : (
        <div className="grid gap-4">
          {consultations.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">{item.serviceName.ar}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.instructorName.ar} - {item.date} - {item.time}</p>
              <p className="mt-2 text-sm font-semibold">{item.statusLabel}</p>
              {item.chatLink && <Link href={item.chatLink} className="mt-4 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">دخول بوابة المحادثة</Link>}
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
