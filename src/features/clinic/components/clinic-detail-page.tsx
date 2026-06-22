'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import {
  getClinicById,
  getClinicByIdIncludingInactive,
} from '@/features/care/services/care-data.service';
import {
  evaluateClinicInitialConsultation,
  isPrerequisiteSatisfied,
  type PrerequisiteStatus,
} from '@/features/care/services/care-prerequisite.service';
import { getStoredClinicBookings, getStoredConsultations } from '@/features/care/services/care-records-storage.service';
import { ShareButton } from '@/components/actions/share-button';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';

function prerequisiteLabel(status: PrerequisiteStatus, isAr: boolean) {
  if (status === 'missing') {
    return isAr
      ? 'يجب إتمام الاستشارة الأولية مع طبيب العيادة قبل اختيار موعد العيادة.'
      : 'You must complete the initial consultation with this clinic doctor before selecting a clinic appointment.';
  }
  if (status === 'scheduled') {
    return isAr
      ? 'لديك استشارة أولية مجدولة. أكملها أولاً قبل حجز موعد العيادة.'
      : 'You have a scheduled initial consultation. Complete it before booking a clinic appointment.';
  }
  if (status === 'unavailable') {
    return isAr ? 'الاستشارة الأولية غير متاحة حالياً.' : 'Initial consultation is currently unavailable.';
  }
  return '';
}

export function ClinicDetailPage() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const router = useRouter();
  const { localize, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user, requireAuthAction } = useAuth();

  const activeClinic = getClinicById(clinicId);
  const inactiveClinic = getClinicByIdIncludingInactive(clinicId);
  const hasExistingBooking = user
    ? getStoredClinicBookings(user.id).some((booking) => booking.clinicId === clinicId)
    : false;
  const clinic = activeClinic ?? (hasExistingBooking ? inactiveClinic : undefined);
  const readOnly = !activeClinic && Boolean(clinic);
  const isAr = language === 'ar';

  if (!clinic) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{isAr ? 'العيادة غير متاحة.' : 'Clinic is unavailable.'}</div>;
  }

  const prerequisiteStatus = user ? evaluateClinicInitialConsultation(user.id, clinic.id) : 'missing';
  const prerequisiteComplete = isPrerequisiteSatisfied(prerequisiteStatus);
  const scheduledRecord = user
    ? getStoredConsultations(user.id).find(
        (record) =>
          record.clinicId === clinic.id &&
          record.serviceKind === 'clinic_initial' &&
          (record.status === 'scheduled' || record.status === 'purchased'),
      )
    : undefined;

  const handleBook = () => {
    if (readOnly) return;
    const initialHref = `/consultations/${clinic.doctor.id}/book?clinicId=${clinic.id}&isInitial=true`;
    const bookingHref = `/clinic/${clinic.id}/book`;

    if (!user) {
      savePendingIntent({
        type: prerequisiteComplete ? 'clinic.booking' : 'consultation.booking',
        href: prerequisiteComplete ? bookingHref : initialHref,
        returnUrl: `/clinic/${clinic.id}`,
        label: localize(clinic.name),
        clinicId: clinic.id,
        doctorId: clinic.doctor.id,
        itemId: clinic.id,
        itemKind: 'clinic',
      });
    }
    if (!requireAuthAction()) return;

    if (prerequisiteStatus === 'scheduled' && scheduledRecord) {
      router.push(`/consultation/${scheduledRecord.id}`);
      return;
    }
    if (!prerequisiteComplete) {
      router.push(initialHref);
      return;
    }
    router.push(bookingHref);
  };

  const ctaLabel = readOnly
    ? (isAr ? 'العيادة غير متاحة للحجز الجديد' : 'Clinic unavailable for new bookings')
    : prerequisiteComplete
      ? (isAr ? 'حجز موعد عيادة' : 'Book clinic appointment')
      : prerequisiteStatus === 'scheduled'
        ? (isAr ? 'عرض الاستشارة الأولية' : 'View initial consultation')
        : (isAr ? 'حجز الاستشارة الأولية' : 'Book initial consultation');

  return (
    <main className="min-h-screen bg-slate-50">
      {readOnly && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 text-center text-sm font-semibold text-amber-900">
          {isAr ? 'هذه العيادة غير نشطة حالياً. يمكنك عرض التفاصيل فقط لأن لديك حجزاً سابقاً.' : 'This clinic is inactive. You can view details because you have an existing booking.'}
        </div>
      )}
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
              <ShareButton title={localize(clinic.name)} />
              <FavoriteButton favorite={{ itemId: clinic.id, kind: 'clinic', title: localize(clinic.name), href: `/clinic/${clinic.id}`, isAvailable: !readOnly }} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="space-y-6">
          <article className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-slate-950">{isAr ? 'عن العيادة' : 'About clinic'}</h2>
            <p className="mt-3 leading-8 text-slate-600">{localize(clinic.description)}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-slate-950">{isAr ? 'الاختصاصات والخدمات' : 'Specialties and services'}</h2>
            <p className="mt-3 leading-8 text-slate-600">{localize(clinic.specialties)}</p>
          </article>
        </div>
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          <img src={clinic.doctor.avatar} alt={localize(clinic.doctor.name)} className="h-20 w-20 rounded-full object-cover" />
          <h2 className="mt-4 font-bold text-slate-950">{localize(clinic.doctor.name)}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{localize(clinic.doctor.bio)}</p>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500 block">{isAr ? 'سعر الكشفية' : 'Clinic Appointment Fee'}</span>
            <span className="text-2xl font-bold text-emerald-700">{formatPrice(clinic.price)}</span>
          </div>
          {!prerequisiteComplete && user && !readOnly && (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-800">
              {prerequisiteLabel(prerequisiteStatus, isAr)}
            </p>
          )}
          {prerequisiteStatus === 'scheduled' && scheduledRecord && (
            <Link href={`/consultation/${scheduledRecord.id}`} className="mt-3 block text-sm font-semibold text-emerald-700 hover:underline">
              {isAr ? 'عرض تفاصيل الاستشارة الأولية' : 'View initial consultation details'}
            </Link>
          )}
          <button
            onClick={handleBook}
            disabled={readOnly || prerequisiteStatus === 'unavailable'}
            className="mt-5 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {ctaLabel}
          </button>
        </aside>
      </section>
    </main>
  );
}
