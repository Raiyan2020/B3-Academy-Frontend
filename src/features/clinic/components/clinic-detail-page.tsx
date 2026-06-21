'use client';

import { Share2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { useLanguage } from '../../../../LanguageContext';
import { getClinicById } from '@/features/care/services/care-data.service';
import { addStoredClinicBooking } from '@/features/care/services/care-records-storage.service';
import { createSuccessfulPayment } from '@/features/payments/services/payments-storage.service';

export function ClinicDetailPage() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const router = useRouter();
  const { localize, language } = useLanguage();
  const { user, requireAuthAction } = useAuth();
  const [message, setMessage] = useState('');
  const clinic = getClinicById(clinicId);

  if (!clinic) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{language === 'ar' ? 'العيادة غير متاحة.' : 'Clinic is unavailable.'}</div>;
  }

  const hasInitialConsultation = user?.consultations?.some((item) => item.clinicId === clinic.id && item.isCompleted);

  const handleBook = () => {
    if (!requireAuthAction()) return;
    if (!hasInitialConsultation) {
      router.push(`/consultations/${clinic.doctor.id}/book?format=video&clinicId=${clinic.id}&isInitial=true`);
      return;
    }
    router.push(`/clinic/${clinic.id}/book`);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-white">
        <img src={clinic.image} alt={localize(clinic.name)} className="h-80 w-full object-cover" />
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">{localize(clinic.category)}</p>
              <h1 className="mt-2 text-4xl font-bold text-slate-950">{localize(clinic.name)}</h1>
              <p className="mt-3 text-slate-600">{clinic.address}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-md border border-slate-300 p-3 text-slate-700"><Share2 className="h-5 w-5" /></button>
              <FavoriteButton favorite={{ itemId: clinic.id, kind: 'clinic', title: localize(clinic.name), href: `/clinic/${clinic.id}`, isAvailable: true }} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        {message && <div className="lg:col-span-2 rounded-md bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div>}
        <div className="space-y-6">
          <article className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-slate-950">{language === 'ar' ? 'عن العيادة' : 'About clinic'}</h2>
            <p className="mt-3 leading-8 text-slate-600">{localize(clinic.description)}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-slate-950">{language === 'ar' ? 'الاختصاصات والخدمات' : 'Specialties and services'}</h2>
            <p className="mt-3 leading-8 text-slate-600">{localize(clinic.specialties)}</p>
          </article>
        </div>
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          <img src={clinic.doctor.avatar} alt={localize(clinic.doctor.name)} className="h-20 w-20 rounded-full object-cover" />
          <h2 className="mt-4 font-bold text-slate-950">{localize(clinic.doctor.name)}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{localize(clinic.doctor.bio)}</p>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500 block">{language === 'ar' ? 'سعر الكشفية' : 'Clinic Appointment Fee'}</span>
            <span className="text-2xl font-bold text-emerald-700">${clinic.price}</span>
          </div>
          {!hasInitialConsultation && user && (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-800">
              {language === 'ar' ? 'يجب إتمام الاستشارة الأولية مع طبيب العيادة قبل اختيار موعد العيادة.' : 'You must complete the initial consultation with this clinic doctor before selecting a clinic appointment.'}
            </p>
          )}
          <button onClick={handleBook} className="mt-5 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">
            {hasInitialConsultation ? (language === 'ar' ? 'حجز موعد عيادة' : 'Book clinic appointment') : language === 'ar' ? 'حجز الاستشارة الأولية' : 'Book initial consultation'}
          </button>
        </aside>
      </section>
    </main>
  );
}
