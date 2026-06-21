'use client';

import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { getAvailableBookingSlots } from '../services/booking-slots.service';
import { useLanguage } from '../../../../LanguageContext';

interface BookingSlotSelectorProps {
  onSelectSlot: (slotId: string, date: string, time: string) => void;
  title: string;
  description: string;
}

export const BookingSlotSelector: React.FC<BookingSlotSelectorProps> = ({
  onSelectSlot,
  title,
  description,
}) => {
  const { localize, language, dir } = useLanguage();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const slots = getAvailableBookingSlots();

  const handleConfirm = () => {
    const selected = slots.find((s) => s.id === selectedSlotId);
    if (selected) {
      onSelectSlot(selected.id, selected.date, selected.time);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8" dir={dir}>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">{description}</p>

        <div className="mt-8">
          <label className="block text-sm font-semibold text-slate-700">
            {language === 'ar' ? 'اختر موعداً متاحاً' : 'Select an available appointment slot'}
          </label>

          {slots.length === 0 ? (
            <div className="mt-4 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
              {language === 'ar' ? 'لا توجد مواعيد متاحة حالياً.' : 'No slots currently available.'}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`flex flex-col items-start rounded-xl border-2 p-4 text-start transition-all ${
                    selectedSlotId === slot.id
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-slate-900">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      {slot.date}
                    </span>
                    {selectedSlotId === slot.id && (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <span className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {slot.time}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedSlotId}
          className="mt-8 w-full rounded-xl bg-emerald-700 py-3.5 text-center font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {language === 'ar' ? 'تأكيد الموعد والمتابعة للدفع' : 'Confirm Appointment & Pay'}
        </button>
      </div>
    </div>
  );
};
