import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import { useNavigate } from '@/lib/routing/next-router-compat';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';
import { useConsultationCatalogDoctors } from '../hooks/use-consultations-catalog';
import { useQueries } from '@tanstack/react-query';
import { consultationCatalogKeys } from '../query-keys';
import { getDoctorConsultationPackages } from '../services/consultations-catalog.service';

export function BookingFlow() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user, requireAuthAction } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'individual' | 'packages'>('individual');
  const [query, setQuery] = useState('');
  const catalogQuery = useConsultationCatalogDoctors(query || undefined);
  const apiDoctors = catalogQuery.data?.items ?? [];
  const apiPackageQueries = useQueries({
    queries: apiDoctors.map((doctor) => ({
      queryKey: consultationCatalogKeys.packages(doctor.id),
      queryFn: () => getDoctorConsultationPackages(doctor.id, { perPage: 50 }),
      enabled: apiDoctors.length > 0,
    })),
  });
  const packagesLoading = apiPackageQueries.some((result) => result.isLoading);
  const packagesErrored = apiPackageQueries.some((result) => result.isError);
  const apiPackages = apiPackageQueries.flatMap((result, index) =>
    (result.data?.items ?? []).map((item) => ({ item, doctorId: apiDoctors[index].id })),
  );

  const startIndividualBooking = (doctorId: string, format: 'video' | 'text') => {
    const href = `/consultations/${doctorId}/book?format=${format}`;
    if (!user) savePendingIntent({ type: 'consultation.booking', href, label: `Consultation ${format}`, doctorId, format });
    if (!requireAuthAction()) return;
    navigate(href);
  };

  const startApiPackageCheckout = (packageId: string, doctorId: string) => {
    const href = `/checkout/consultation-package/${packageId}?doctorId=${doctorId}`;
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
          catalogQuery.isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              {language === 'ar' ? 'جارٍ تحميل الأطباء...' : 'Loading doctors...'}
            </div>
          ) : catalogQuery.isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
              {language === 'ar' ? 'تعذر تحميل قائمة الأطباء. حاول مرة أخرى.' : 'Failed to load doctors. Please try again.'}
            </div>
          ) : apiDoctors.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              {language === 'ar' ? 'لا يوجد أطباء متاحون حاليًا.' : 'No doctors are available right now.'}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {apiDoctors.map((doctor) => (
                <article key={doctor.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  {doctor.image && <Image src={doctor.image} alt={doctor.name} width={80} height={80} className="h-20 w-20 rounded-full object-cover" />}
                  <h2 className="mt-4 text-xl font-bold text-slate-950">{doctor.name}</h2>
                  {doctor.brief && <p className="mt-2 text-sm leading-6 text-slate-600">{doctor.brief}</p>}
                  {doctor.clinic && <p className="mt-2 text-sm text-emerald-700">{language === 'ar' ? 'العيادة المرتبطة:' : 'Linked clinic:'} {doctor.clinic.name}</p>}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {doctor.hasVideoConsultation && <button onClick={() => startIndividualBooking(doctor.id, 'video')} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{language === 'ar' ? 'حجز مرئي' : 'Book video'}</button>}
                    {doctor.hasTextConsultation && <button onClick={() => startIndividualBooking(doctor.id, 'text')} className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700">{language === 'ar' ? 'حجز نصي' : 'Book text'}</button>}
                  </div>
                </article>
              ))}
            </div>
          )
        ) : catalogQuery.isLoading || packagesLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            {language === 'ar' ? 'جارٍ تحميل الباقات...' : 'Loading packages...'}
          </div>
        ) : catalogQuery.isError || packagesErrored ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            {language === 'ar' ? 'تعذر تحميل باقات الاستشارات. حاول مرة أخرى.' : 'Failed to load consultation packages. Please try again.'}
          </div>
        ) : apiPackages.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            {language === 'ar' ? 'لا توجد باقات استشارات متاحة حاليًا.' : 'No consultation packages are available right now.'}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {apiPackages.map(({ item, doctorId }) => (
              <article key={`${doctorId}-${item.id}`} className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-xl font-bold text-slate-950">{item.name}</h2>
                {item.description && <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>}
                <p className="mt-3 text-sm font-semibold text-slate-700">{item.sessionsCount} {language === 'ar' ? 'جلسات' : 'sessions'} · {formatPrice(item.totalPrice)}</p>
                <button onClick={() => startApiPackageCheckout(item.id, doctorId)} className="mt-5 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{language === 'ar' ? 'شراء الباقة' : 'Buy package'}</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export { BookingFlow as Booking };
