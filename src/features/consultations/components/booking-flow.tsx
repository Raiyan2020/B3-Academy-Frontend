import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { CARE_DOCTORS, getActiveConsultationPackages } from '@/features/care/services/care-data.service';
import { useNavigate } from '@/lib/routing/next-router-compat';

export function BookingFlow() {
  const { localize, language } = useLanguage();
  const { user, requireAuthAction } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'individual' | 'packages'>('individual');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const doctors = useMemo(() => CARE_DOCTORS.filter((doctor) => localize(doctor.name).toLowerCase().includes(query.toLowerCase())), [localize, query]);
  const packages = getActiveConsultationPackages().filter((item) => doctors.some((doctor) => doctor.id === item.doctorId));

  const startIndividualBooking = (doctorId: string, format: 'video' | 'text') => {
    if (!requireAuthAction()) return;
    navigate(`/consultations/${doctorId}/book?format=${format}`);
  };

  const buyPackage = (packageId: string) => {
    if (!requireAuthAction()) return;
    navigate(`/checkout/consultation-package/${packageId}`);
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
        {message && <p className="mb-5 rounded-md bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</p>}
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
            {doctors.map((doctor) => (
              <article key={doctor.id} className="rounded-lg border border-slate-200 bg-white p-5">
                <img src={doctor.avatar} alt={localize(doctor.name)} className="h-20 w-20 rounded-full object-cover" />
                <h2 className="mt-4 text-xl font-bold text-slate-950">{localize(doctor.name)}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{localize(doctor.bio)}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-bold">{language === 'ar' ? 'اتصال مرئي' : 'Video call'}</p>
                    <p className="text-slate-600">45 min - $150</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-bold">{language === 'ar' ? 'محادثة نصية' : 'Text chat'}</p>
                    <p className="text-slate-600">30 min - $100</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={() => startIndividualBooking(doctor.id, 'video')} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{language === 'ar' ? 'حجز مرئي' : 'Book video'}</button>
                  <button onClick={() => startIndividualBooking(doctor.id, 'text')} className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700">{language === 'ar' ? 'حجز نصي' : 'Book text'}</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {packages.map((item) => {
              const doctor = CARE_DOCTORS.find((candidate) => candidate.id === item.doctorId);
              return (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-xl font-bold text-slate-950">{localize(item.name)}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{localize(item.description)}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">{language === 'ar' ? 'الطبيب' : 'Doctor'}: {doctor ? localize(doctor.name) : '-'}</p>
                  <p className="text-sm text-slate-600">{item.sessionCount} {language === 'ar' ? 'جلسات' : 'sessions'} - {item.sessionDurationMinutes} min - ${item.price}</p>
                  <button onClick={() => buyPackage(item.id)} className="mt-5 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{language === 'ar' ? 'شراء الباقة' : 'Buy package'}</button>
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
