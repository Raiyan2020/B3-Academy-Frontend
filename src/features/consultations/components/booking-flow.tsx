import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import {
  getActiveConsultationPackages,
  getActiveDoctors,
  getClinicById,
} from '@/features/care/services/care-data.service';
import { getDoctorConsultationTypes } from '@/features/care/services/care-schedule-config.service';
import { getStoredConsultations } from '@/features/care/services/care-records-storage.service';
import { canPurchaseConsultationPackage } from '@/features/care/services/booking-guards.service';
import { useNavigate } from '@/lib/routing/next-router-compat';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';

export function BookingFlow() {
  const { localize, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user, requireAuthAction } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'individual' | 'packages'>('individual');
  const [query, setQuery] = useState('');
  const doctors = useMemo(
    () =>
      getActiveDoctors().filter((doctor) =>
        localize(doctor.name).toLowerCase().includes(query.toLowerCase()),
      ),
    [localize, query],
  );
  const packages = getActiveConsultationPackages().filter((item) =>
    doctors.some((doctor) => doctor.id === item.doctorId),
  );

  const userConsultations = user ? getStoredConsultations(user.id) : [];
  const hasUpcomingWithDoctor = (doctorId: string) =>
    userConsultations.some(
      (record) =>
        record.doctorId === doctorId &&
        record.kind !== 'package' &&
        (record.status === 'scheduled' || record.status === 'purchased'),
    );
  const hasPackageWithDoctor = (doctorId: string) =>
    userConsultations.some(
      (record) =>
        record.doctorId === doctorId &&
        record.kind === 'package' &&
        record.status !== 'cancelled' &&
        record.status !== 'completed',
    );

  const startIndividualBooking = (doctorId: string, format: 'video' | 'text') => {
    const href = `/consultations/${doctorId}/book?format=${format}`;
    if (!user) savePendingIntent({ type: 'consultation.booking', href, label: `Consultation ${format}`, doctorId, format });
    if (!requireAuthAction()) return;
    navigate(href);
  };

  const startPackageBooking = (packageId: string) => {
    const href = `/consultations/package/${packageId}/book`;
    if (!user) savePendingIntent({ type: 'consultation.package-session', href, label: 'Consultation package', packageId, itemId: packageId, itemKind: 'package' });
    if (!requireAuthAction()) return;
    navigate(href);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{language === 'ar' ? 'الاستشارات' : 'Consultations'}</p>
          <h1 className="text-4xl font-bold text-slate-950">{language === 'ar' ? 'استشارات فردية وباقات استشارات' : 'Individual consultations and packages'}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {language === 'ar'
              ? 'هذه الاستشارات العامة مستقلة عن الاستشارة الأولية المطلوبة لحجز العيادات. الحجز والدفع يتطلبان تسجيل الدخول.'
              : 'These general consultations are separate from clinic initial consultations. Booking and payment require login.'}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <button onClick={() => setTab('individual')} className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'individual' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>{language === 'ar' ? 'استشارات فردية' : 'Individual'}</button>
              <button onClick={() => setTab('packages')} className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'packages' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>{language === 'ar' ? 'باقات الاستشارات' : 'Packages'}</button>
            </div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={language === 'ar' ? 'ابحث باسم الطبيب' : 'Search by doctor name'} className="rounded-md border border-slate-300 px-3 py-2" />
          </div>
        </div>

        {tab === 'individual' ? (
          <div className="grid gap-5 md:grid-cols-2">
            {doctors.map((doctor) => {
              const types = getDoctorConsultationTypes(doctor.id);
              const linkedClinic = doctor.clinicId ? getClinicById(doctor.clinicId) : undefined;
              const booked = hasUpcomingWithDoctor(doctor.id);
              return (
                <article key={doctor.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  <img src={doctor.avatar} alt={localize(doctor.name)} className="h-20 w-20 rounded-full object-cover" />
                  <h2 className="mt-4 text-xl font-bold text-slate-950">{localize(doctor.name)}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{localize(doctor.bio)}</p>
                  {linkedClinic && (
                    <p className="mt-2 text-sm text-emerald-700">
                      {language === 'ar' ? 'العيادة المرتبطة:' : 'Linked clinic:'} {localize(linkedClinic.name)}
                    </p>
                  )}
                  {booked && (
                    <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                      {language === 'ar' ? 'لديك استشارة محجوزة مع هذا الطبيب' : 'You have a booked consultation with this doctor'}
                    </p>
                  )}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {types.map((type) => (
                      <div key={type.format} className="rounded-md bg-slate-50 p-3 text-sm">
                        <p className="font-bold">{type.format === 'video' ? (language === 'ar' ? 'اتصال مرئي' : 'Video call') : (language === 'ar' ? 'محادثة نصية' : 'Text chat')}</p>
                        <p className="text-slate-600">{type.durationMinutes} min - {formatPrice(type.priceUsd)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {types.map((type) => (
                      <button
                        key={type.format}
                        onClick={() => startIndividualBooking(doctor.id, type.format)}
                        className={`rounded-md px-4 py-2 text-sm font-semibold ${type.format === 'video' ? 'bg-emerald-700 text-white' : 'border border-emerald-700 text-emerald-700'}`}
                      >
                        {type.format === 'video'
                          ? (language === 'ar' ? 'حجز مرئي' : 'Book video')
                          : (language === 'ar' ? 'حجز نصي' : 'Book text')}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {packages.map((item) => {
              const doctor = doctors.find((candidate) => candidate.id === item.doctorId);
              const purchased = hasPackageWithDoctor(item.doctorId);
              const canBuy = user ? canPurchaseConsultationPackage(user.id) : true;
              return (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-xl font-bold text-slate-950">{localize(item.name)}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{localize(item.description)}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">{language === 'ar' ? 'الطبيب' : 'Doctor'}: {doctor ? localize(doctor.name) : '-'}</p>
                  <p className="text-sm text-slate-600">
                    {item.sessionCount} {language === 'ar' ? 'جلسات' : 'sessions'} · {item.sessionDurationMinutes} min · {formatPrice(item.price)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {language === 'ar' ? 'الفاصل بين الجلسات:' : 'Interval:'} {item.sessionIntervalDays} {language === 'ar' ? 'أيام' : 'days'}
                  </p>
                  {purchased && (
                    <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                      {language === 'ar' ? 'تم شراء باقة مع هذا الطبيب' : 'Package purchased with this doctor'}
                    </p>
                  )}
                  <button
                    onClick={() => startPackageBooking(item.id)}
                    disabled={!canBuy}
                    className="mt-5 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {language === 'ar' ? 'حجز كل الجلسات والدفع' : 'Book all sessions & pay'}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export { BookingFlow as Booking };
