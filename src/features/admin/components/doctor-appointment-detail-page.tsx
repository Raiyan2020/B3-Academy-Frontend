'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { getDoctorAppointment } from '@/features/care/services/doctor-portal.service';
import { useLanguage } from '../../../../LanguageContext';

export function DoctorAppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const appointment = user ? getDoctorAppointment(params.id, user.id) : null;

  if (!appointment) {
    return (
      <section>
        <h2 className="text-xl font-bold text-slate-950">{isAr ? 'الموعد غير موجود' : 'Appointment not found'}</h2>
        <Link href="/doctor" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'العودة للقائمة' : 'Back to list'}
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">{localize(appointment.serviceName)}</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-500">{isAr ? 'التاريخ' : 'Date'}</dt>
          <dd>{appointment.date}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">{isAr ? 'الوقت' : 'Time'}</dt>
          <dd>{appointment.time}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">{isAr ? 'الحالة' : 'Status'}</dt>
          <dd>{appointment.status}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">{isAr ? 'النوع' : 'Kind'}</dt>
          <dd>{appointment.kind}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">{isAr ? 'السعر' : 'Price'}</dt>
          <dd>${appointment.price}</dd>
        </div>
        {appointment.portalHref && (
          <div className="sm:col-span-2">
            <dt className="font-semibold text-slate-500">{isAr ? 'رابط الجلسة' : 'Session link'}</dt>
            <dd>
              <a href={appointment.portalHref} className="font-semibold text-emerald-700 hover:underline" target="_blank" rel="noreferrer">
                {appointment.portalHref}
              </a>
            </dd>
          </div>
        )}
      </dl>
      <Link href="/doctor" className="mt-6 inline-block text-sm font-semibold text-emerald-700 hover:underline">
        {isAr ? 'العودة للقائمة' : 'Back to list'}
      </Link>
    </section>
  );
}
