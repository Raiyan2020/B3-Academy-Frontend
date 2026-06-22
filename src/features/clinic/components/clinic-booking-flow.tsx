'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import {
  getActiveClinics,
  getClinicById,
  listCareDoctors,
} from '@/features/care/services/care-data.service';
import { canBookClinicAppointment } from '@/features/care/services/booking-guards.service';
import { BookingSlotSelector } from '@/features/consultations/components/booking-slot-selector';

interface ClinicBookingFlowProps {
  initialClinicId: string;
}

export function ClinicBookingFlow({ initialClinicId }: ClinicBookingFlowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { localize, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const clinics = getActiveClinics();
  const doctors = listCareDoctors();

  const [clinicId, setClinicId] = useState(initialClinicId);
  const [clientName, setClientName] = useState(user?.name ?? '');
  const [clientEmail, setClientEmail] = useState(user?.email ?? '');
  const [clientPhone, setClientPhone] = useState(user?.phone ?? '');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'slot' | 'review'>('slot');
  const [selectedSlot, setSelectedSlot] = useState<{ id: string; date: string; time: string } | null>(null);

  const clinic = getClinicById(clinicId);
  const pairedDoctor = clinic?.doctor ?? doctors.find((doctor) => doctor.clinicId === clinicId);

  const clinicOptions = useMemo(
    () => clinics.map((item) => ({ id: item.id, label: localize(item.name), doctorId: item.doctor.id })),
    [clinics, localize],
  );

  const doctorOptions = useMemo(
    () =>
      doctors
        .filter((doctor) => doctor.isActive !== false && doctor.clinicId)
        .map((doctor) => ({
          id: doctor.id,
          label: localize(doctor.name),
          clinicId: doctor.clinicId!,
        })),
    [doctors, localize],
  );

  if (!user) return null;

  if (!canBookClinicAppointment(user.id)) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-lg font-semibold text-amber-900">
          {language === 'ar'
            ? 'لديك حجزان نشطان بالفعل. أكمل أحدهما قبل حجز موعد جديد.'
            : 'You already have two active clinic bookings. Complete one before booking another.'}
        </p>
      </div>
    );
  }

  if (!clinic || !pairedDoctor) {
    return (
      <div className="p-20 text-center text-slate-600">
        {language === 'ar' ? 'العيادة غير متاحة للحجز.' : 'Clinic is not available for booking.'}
      </div>
    );
  }

  const handleClinicChange = (nextClinicId: string) => {
    setClinicId(nextClinicId);
    setSelectedSlot(null);
    setStep('slot');
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find((item) => item.id === doctorId);
    if (doctor?.clinicId) handleClinicChange(doctor.clinicId);
  };

  const handleSelectSlot = (slotId: string, date: string, time: string) => {
    setSelectedSlot({ id: slotId, date, time });
    setStep('review');
  };

  const proceedToCheckout = () => {
    if (!selectedSlot) return;
    const params = new URLSearchParams({
      slotId: selectedSlot.id,
      slotDate: selectedSlot.date,
      slotTime: selectedSlot.time,
      clientName,
      clientEmail,
      clientPhone,
      notes,
    });
    router.push(`/checkout/clinic-appointment/${clinicId}?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">{language === 'ar' ? 'العيادة' : 'Clinic'}</span>
            <select
              value={clinicId}
              onChange={(e) => handleClinicChange(e.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            >
              {clinicOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">{language === 'ar' ? 'الطبيب' : 'Doctor'}</span>
            <select
              value={pairedDoctor.id}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            >
              {doctorOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {language === 'ar' ? 'سعر الكشفية:' : 'Appointment fee:'}{' '}
          <strong className="text-emerald-700">{formatPrice(clinic.price)}</strong>
        </p>
      </div>

      {step === 'slot' ? (
        <BookingSlotSelector
          doctorId={pairedDoctor.id}
          clinicId={clinicId}
          serviceKind="individual_video"
          onSelectSlot={handleSelectSlot}
          title={language === 'ar' ? `حجز موعد في ${localize(clinic.name)}` : `Book at ${localize(clinic.name)}`}
          description={
            language === 'ar'
              ? `اختر اليوم ثم الوقت المناسب مع ${localize(pairedDoctor.name)}.`
              : `Pick a day, then a time with ${localize(pairedDoctor.name)}.`
          }
          confirmLabel={language === 'ar' ? 'متابعة للمراجعة' : 'Continue to review'}
        />
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'ar' ? 'مراجعة الحجز' : 'Review booking'}
          </h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p><strong>{language === 'ar' ? 'العيادة:' : 'Clinic:'}</strong> {localize(clinic.name)}</p>
            <p><strong>{language === 'ar' ? 'الطبيب:' : 'Doctor:'}</strong> {localize(pairedDoctor.name)}</p>
            <p><strong>{language === 'ar' ? 'الموعد:' : 'Appointment:'}</strong> {selectedSlot?.date} {selectedSlot?.time}</p>
            <p><strong>{language === 'ar' ? 'السعر:' : 'Price:'}</strong> {formatPrice(clinic.price)}</p>
          </div>
          <div className="mt-6 grid gap-4">
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={language === 'ar' ? 'الاسم' : 'Name'} className="rounded-md border border-slate-300 px-3 py-2" />
            <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'} className="rounded-md border border-slate-300 px-3 py-2" />
            <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={language === 'ar' ? 'الهاتف' : 'Phone'} className="rounded-md border border-slate-300 px-3 py-2" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optional)'} className="rounded-md border border-slate-300 px-3 py-2" rows={3} />
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep('slot')} className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700">
              {language === 'ar' ? 'تغيير الموعد' : 'Change slot'}
            </button>
            <button type="button" onClick={proceedToCheckout} className="flex-1 rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white">
              {language === 'ar' ? 'المتابعة للدفع' : 'Continue to payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
