'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import type { ConsultationKind } from '@/features/business/status.types';
import { getAvailableDays, getAvailableTimesForDay } from '@/features/care/services/slot-repository.service';
import { useLanguage } from '../../../../LanguageContext';

interface BookingSlotSelectorProps {
  doctorId: string;
  serviceKind?: ConsultationKind;
  clinicId?: string;
  tripId?: string;
  onSelectSlot: (slotId: string, date: string, time: string) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  minDate?: string;
}

export const BookingSlotSelector: React.FC<BookingSlotSelectorProps> = ({
  doctorId,
  serviceKind = 'individual_video',
  clinicId,
  tripId,
  onSelectSlot,
  title,
  description,
  confirmLabel,
  minDate,
}) => {
  const { language, dir } = useLanguage();
  const filters = { doctorId, serviceKind, clinicId, tripId };
  const days = useMemo(() => {
    const available = getAvailableDays(filters);
    if (!minDate) return available;
    return available.filter((day) => day >= minDate);
  }, [doctorId, serviceKind, clinicId, tripId, minDate]);

  const [selectedDay, setSelectedDay] = useState<string | null>(days[0] ?? null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const timesForDay = useMemo(() => {
    if (!selectedDay) return [];
    return getAvailableTimesForDay(filters, selectedDay);
  }, [doctorId, serviceKind, clinicId, tripId, selectedDay]);

  const handleConfirm = () => {
    const selected = timesForDay.find((slot) => slot.id === selectedSlotId);
    if (selected) {
      onSelectSlot(selected.id, selected.date, selected.time);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8" dir={dir}>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">{description}</p>

        {days.length === 0 ? (
          <div className="mt-8 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
            {language === 'ar' ? 'لا توجد مواعيد متاحة حالياً.' : 'No slots currently available.'}
          </div>
        ) : (
          <>
            <div className="mt-8">
              <label className="block text-sm font-semibold text-slate-700">
                {language === 'ar' ? 'اختر اليوم' : 'Select a day'}
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day);
                      setSelectedSlotId(null);
                    }}
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
                      selectedDay === day
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {day}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <label className="block text-sm font-semibold text-slate-700">
                {language === 'ar' ? 'اختر الوقت' : 'Select a time'}
              </label>
              {timesForDay.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  {language === 'ar' ? 'لا توجد أوقات متاحة لهذا اليوم.' : 'No times available for this day.'}
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {timesForDay.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-start transition-all ${
                        selectedSlotId === slot.id
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2 font-semibold text-slate-900">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        {slot.time}
                      </span>
                      {selectedSlotId === slot.id && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedSlotId}
          className="mt-8 w-full rounded-xl bg-emerald-700 py-3.5 text-center font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {confirmLabel ?? (language === 'ar' ? 'تأكيد الموعد والمتابعة' : 'Confirm & Continue')}
        </button>
      </div>
    </div>
  );
};
