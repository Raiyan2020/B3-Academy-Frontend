'use client';

import { Search, Stethoscope, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { getActiveClinics } from '@/features/care/services/care-data.service';
import { GENERAL_CLINIC_SERVICES } from '@/features/care/services/care-schedule-config.service';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';

export function ClinicPage() {
  const { localize, language } = useLanguage();
  const { user, requireAuthAction } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const clinics = getActiveClinics();
  const categories = Array.from(new Set(clinics.map((clinic) => localize(clinic.category))));
  const showCategoryFilter = categories.length > 1;

  const filtered = useMemo(() => {
    return clinics.filter((clinic) => {
      const byName = localize(clinic.name).toLowerCase().includes(query.trim().toLowerCase());
      const byCategory = category === 'all' || localize(clinic.category) === category;
      return byName && byCategory;
    });
  }, [category, clinics, localize, query]);

  const handleDirectBook = () => {
    const firstClinic = filtered[0] ?? clinics[0];
    if (!firstClinic) return;
    const href = `/clinic/${firstClinic.id}/book`;
    if (!user) {
      savePendingIntent({
        type: 'clinic.booking',
        href,
        returnUrl: '/clinic',
        label: localize(firstClinic.name),
        clinicId: firstClinic.id,
        itemId: firstClinic.id,
        itemKind: 'clinic',
      });
    }
    if (!requireAuthAction()) return;
    router.push(href);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{language === 'ar' ? 'العيادات' : 'Clinics'}</p>
          <h1 className="text-4xl font-bold text-slate-950">{language === 'ar' ? 'تصفح العيادات المتاحة' : 'Browse available clinics'}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {language === 'ar'
              ? 'يمكنك تصفح العيادات وفتح التفاصيل دون تسجيل. حجز الموعد يتطلب تسجيل الدخول وإتمام الاستشارة الأولية مع طبيب العيادة.'
              : 'You can browse clinics and details without signing in. Booking requires login and completing the initial consultation with the clinic doctor.'}
          </p>
          {clinics.length > 0 && (
            <button
              type="button"
              onClick={handleDirectBook}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white"
            >
              <CalendarPlus className="h-4 w-4" />
              {language === 'ar' ? 'حجز موعد مباشر' : 'Book appointment directly'}
            </button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-950">{language === 'ar' ? 'الخدمات العامة' : 'General services'}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {GENERAL_CLINIC_SERVICES.map((group) => (
              <article key={group.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <img src={group.image} alt={localize(group.name)} className="h-44 w-full object-cover" />
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-950">{localize(group.name)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{localize(group.description)}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {group.services.map((service) => (
                      <li key={localize(service.name)}>
                        <strong>{localize(service.name)}</strong> — {localize(service.description)}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-300 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={language === 'ar' ? 'ابحث باسم العيادة فقط' : 'Search by clinic name only'} className="w-full outline-none" />
          </div>
          {showCategoryFilter && (
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
              <option value="all">{language === 'ar' ? 'كل العيادات' : 'All clinics'}</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">{language === 'ar' ? 'لا توجد عيادات مطابقة.' : 'No matching clinics.'}</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((clinic) => (
              <Link key={clinic.id} href={`/clinic/${clinic.id}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                <img src={clinic.image} alt={localize(clinic.name)} className="h-52 w-full object-cover" />
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <Stethoscope className="h-4 w-4" />
                    {localize(clinic.category)}
                  </div>
                  <h2 className="text-xl font-bold text-slate-950">{localize(clinic.name)}</h2>
                  <p className="mt-2 text-sm text-slate-500">{clinic.address}</p>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{localize(clinic.shortDescription)}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">{localize(clinic.specialties)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export { ClinicPage as Clinic };
