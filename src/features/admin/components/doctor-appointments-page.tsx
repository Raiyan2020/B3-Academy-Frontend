'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { listDoctorAppointments } from '@/features/care/services/doctor-portal.service';
import { useLanguage } from '../../../../LanguageContext';

export function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const appointments = user ? listDoctorAppointments(user.id) : [];

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-950">{isAr ? 'مواعيدي' : 'My appointments'}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {isAr ? 'قائمة الاستشارات المجدولة المرتبطة بحسابك.' : 'Scheduled consultations linked to your account.'}
      </p>
      {appointments.length === 0 ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-slate-950">{isAr ? 'لا توجد مواعيد' : 'No appointments'}</p>
          <p className="mt-1 text-sm text-slate-500">{isAr ? 'ستظهر الحجوزات هنا عند توفرها.' : 'Bookings will appear here when available.'}</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{localize(appointment.serviceName)}</p>
                <p className="text-sm text-slate-600">
                  {appointment.date} {appointment.time} · {appointment.status}
                </p>
              </div>
              <Link href={`/doctor/appointments/${appointment.id}`} className="text-sm font-semibold text-emerald-700 hover:underline">
                {isAr ? 'عرض التفاصيل' : 'View details'}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
