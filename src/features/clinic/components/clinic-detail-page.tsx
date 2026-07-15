'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { useLanguage } from '../../../../LanguageContext';
import { ShareButton } from '@/components/actions/share-button';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';
import { useClinicDetail } from '../hooks/use-clinics-query';

export function ClinicDetailPage() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, requireAuthAction } = useAuth();
  const isAr = language === 'ar';

  const { data: clinic, isLoading, isError } = useClinicDetail(clinicId);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>;
  }
  if (isError || !clinic) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{isAr ? 'العيادة غير متاحة.' : 'Clinic is unavailable.'}</div>;
  }

  const canBookAppointment = clinic.canBookInClinic;
  const pendingConsultationId = clinic.initialConsultation?.careBookingId ?? null;
  const doctorId = clinic.doctor?.id ?? '';

  const initialHref = `/clinic/${clinic.id}/initial-consultation`;
  const bookingHref = `/clinic/${clinic.id}/book`;

  const handleBook = () => {
    if (!user) {
      savePendingIntent({
        type: canBookAppointment ? 'clinic.booking' : 'consultation.booking',
        href: canBookAppointment ? bookingHref : initialHref,
        returnUrl: `/clinic/${clinic.id}`,
        label: clinic.name,
        clinicId: clinic.id,
        doctorId,
        itemId: clinic.id,
        itemKind: 'clinic',
      });
    }
    if (!requireAuthAction()) return;

    // A pending initial consultation exists — send the user to its portal.
    if (!canBookAppointment && pendingConsultationId && clinic.initialConsultation?.status && clinic.initialConsultation.status !== 'none') {
      router.push(`/consultation/${pendingConsultationId}`);
      return;
    }
    router.push(canBookAppointment ? bookingHref : initialHref);
  };

  const ctaLabel = canBookAppointment
    ? isAr ? 'حجز موعد عيادة' : 'Book clinic appointment'
    : pendingConsultationId
      ? isAr ? 'عرض الاستشارة الأولية' : 'View initial consultation'
      : isAr ? 'حجز الاستشارة الأولية' : 'Book initial consultation';

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-white">
        {clinic.image && <img src={clinic.image} alt={clinic.name} className="h-80 w-full object-cover" />}
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              {clinic.category && <p className="text-sm font-semibold text-emerald-700">{clinic.category.name}</p>}
              <h1 className="mt-2 text-4xl font-bold text-slate-950">{clinic.name}</h1>
              <p className="mt-3 text-slate-600">{clinic.address}</p>
            </div>
            <div className="flex gap-2">
              <ShareButton title={clinic.name} />
              <FavoriteButton favorite={{ itemId: clinic.id, kind: 'clinic', title: clinic.name, href: `/clinic/${clinic.id}`, isAvailable: true }} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="space-y-6">
          {clinic.description && (
            <article className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-bold text-slate-950">{isAr ? 'عن العيادة' : 'About clinic'}</h2>
              <p className="mt-3 whitespace-pre-line leading-8 text-slate-600">{clinic.description}</p>
            </article>
          )}
          {clinic.workingHours.length > 0 && (
            <article className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-bold text-slate-950">{isAr ? 'ساعات العمل' : 'Working hours'}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {clinic.workingHours.map((day) => (
                  <li key={day.day} className="flex justify-between gap-4">
                    <span className="font-semibold text-slate-800">{day.dayLabel}</span>
                    <span>
                      {day.isOff
                        ? isAr ? 'مغلق' : 'Closed'
                        : day.periods.map((p) => `${p.startTime}–${p.endTime}`).join(', ')}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          {clinic.doctor && (
            <>
              {clinic.doctor.image && <img src={clinic.doctor.image} alt={clinic.doctor.name} className="h-20 w-20 rounded-full object-cover" />}
              <h2 className="mt-4 font-bold text-slate-950">{clinic.doctor.name}</h2>
              {clinic.doctor.shortBio && <p className="mt-2 text-sm leading-6 text-slate-600">{clinic.doctor.shortBio}</p>}
            </>
          )}
          {clinic.initialConsultation?.statusLabel && !canBookAppointment && (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-800">
              {clinic.initialConsultation.statusLabel}
            </p>
          )}
          {pendingConsultationId && (
            <Link href={`/consultation/${pendingConsultationId}`} className="mt-3 block text-sm font-semibold text-emerald-700 hover:underline">
              {isAr ? 'عرض تفاصيل الاستشارة الأولية' : 'View initial consultation details'}
            </Link>
          )}
          <button
            onClick={handleBook}
            disabled={!clinic.doctor}
            className="mt-5 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {ctaLabel}
          </button>
        </aside>
      </section>
    </main>
  );
}
