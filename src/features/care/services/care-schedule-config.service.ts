'use client';

import type { ConsultationKind } from '@/features/business/status.types';
import type { LocalizedString } from '../../../../types';

export interface DoctorScheduleConfig {
  doctorId: string;
  serviceKind: ConsultationKind;
  clinicId?: string;
  durationMinutes: number;
  minLeadDays: number;
  workingDays: number[];
  dayStart: string;
  dayEnd: string;
  slotIntervalMinutes: number;
  horizonDays: number;
}

export interface ConsultationTypeConfig {
  format: 'video' | 'text';
  priceUsd: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface GeneralServiceGroup {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  image: string;
  services: Array<{ name: LocalizedString; description: LocalizedString }>;
}

export const DEFAULT_SCHEDULES: DoctorScheduleConfig[] = [
  {
    doctorId: 'dr-sarah',
    serviceKind: 'individual_video',
    durationMinutes: 45,
    minLeadDays: 2,
    workingDays: [0, 1, 2, 3, 4],
    dayStart: '09:00',
    dayEnd: '17:00',
    slotIntervalMinutes: 45,
    horizonDays: 21,
  },
  {
    doctorId: 'dr-sarah',
    serviceKind: 'individual_text',
    durationMinutes: 30,
    minLeadDays: 2,
    workingDays: [0, 1, 2, 3, 4],
    dayStart: '10:00',
    dayEnd: '16:00',
    slotIntervalMinutes: 30,
    horizonDays: 21,
  },
  {
    doctorId: 'dr-sarah',
    serviceKind: 'clinic_initial',
    clinicId: 'clinic-riyadh',
    durationMinutes: 45,
    minLeadDays: 3,
    workingDays: [0, 2, 4],
    dayStart: '09:00',
    dayEnd: '14:00',
    slotIntervalMinutes: 45,
    horizonDays: 28,
  },
  {
    doctorId: 'dr-sarah',
    serviceKind: 'trip_initial',
    durationMinutes: 45,
    minLeadDays: 3,
    workingDays: [1, 3],
    dayStart: '10:00',
    dayEnd: '15:00',
    slotIntervalMinutes: 45,
    horizonDays: 28,
  },
  {
    doctorId: 'dr-sarah',
    serviceKind: 'package_session',
    durationMinutes: 45,
    minLeadDays: 2,
    workingDays: [0, 1, 2, 3, 4],
    dayStart: '09:00',
    dayEnd: '17:00',
    slotIntervalMinutes: 45,
    horizonDays: 42,
  },
  {
    doctorId: 'dr-ali',
    serviceKind: 'individual_video',
    clinicId: 'clinic-dubai',
    durationMinutes: 40,
    minLeadDays: 1,
    workingDays: [1, 2, 3, 4, 5],
    dayStart: '10:00',
    dayEnd: '18:00',
    slotIntervalMinutes: 40,
    horizonDays: 21,
  },
  {
    doctorId: 'dr-ali',
    serviceKind: 'individual_text',
    clinicId: 'clinic-dubai',
    durationMinutes: 30,
    minLeadDays: 1,
    workingDays: [1, 2, 3, 4, 5],
    dayStart: '11:00',
    dayEnd: '17:00',
    slotIntervalMinutes: 30,
    horizonDays: 21,
  },
  {
    doctorId: 'dr-ali',
    serviceKind: 'clinic_initial',
    clinicId: 'clinic-dubai',
    durationMinutes: 40,
    minLeadDays: 2,
    workingDays: [1, 3, 5],
    dayStart: '10:00',
    dayEnd: '15:00',
    slotIntervalMinutes: 40,
    horizonDays: 28,
  },
  {
    doctorId: 'dr-ali',
    serviceKind: 'trip_initial',
    durationMinutes: 40,
    minLeadDays: 2,
    workingDays: [2, 4],
    dayStart: '11:00',
    dayEnd: '16:00',
    slotIntervalMinutes: 40,
    horizonDays: 28,
  },
  {
    doctorId: 'dr-ali',
    serviceKind: 'package_session',
    durationMinutes: 30,
    minLeadDays: 1,
    workingDays: [1, 2, 3, 4, 5],
    dayStart: '10:00',
    dayEnd: '18:00',
    slotIntervalMinutes: 30,
    horizonDays: 42,
  },
  {
    doctorId: 'dr-sarah',
    serviceKind: 'individual_video',
    clinicId: 'clinic-riyadh',
    durationMinutes: 45,
    minLeadDays: 2,
    workingDays: [0, 1, 2, 3, 4],
    dayStart: '09:00',
    dayEnd: '14:00',
    slotIntervalMinutes: 45,
    horizonDays: 21,
  },
];

export const DOCTOR_CONSULTATION_TYPES: Record<string, ConsultationTypeConfig[]> = {
  'dr-sarah': [
    { format: 'video', priceUsd: 150, durationMinutes: 45, isActive: true },
    { format: 'text', priceUsd: 100, durationMinutes: 30, isActive: true },
  ],
  'dr-ali': [
    { format: 'video', priceUsd: 130, durationMinutes: 40, isActive: true },
    { format: 'text', priceUsd: 90, durationMinutes: 30, isActive: true },
  ],
};

export const TRIP_INITIAL_SPECIALIST_IDS = ['dr-sarah', 'dr-ali'];

export const GENERAL_CLINIC_SERVICES: GeneralServiceGroup[] = [
  {
    id: 'general-assessment',
    name: { ar: 'التقييم والفحص', en: 'Assessment & Screening' },
    description: {
      ar: 'خدمات تقييم أولية وفحوصات طبيعية تُنسق عبر المنصة.',
      en: 'Initial assessment and natural screening services coordinated through the platform.',
    },
    image: 'https://picsum.photos/seed/clinic-general-1/800/500',
    services: [
      {
        name: { ar: 'استشارة أولية', en: 'Initial consultation' },
        description: { ar: 'جلسة تقييم مع طبيب العيادة قبل الحجز.', en: 'Assessment session with the clinic doctor before booking.' },
      },
      {
        name: { ar: 'متابعة دورية', en: 'Follow-up visit' },
        description: { ar: 'زيارات متابعة بعد خطة العلاج.', en: 'Follow-up visits after the care plan.' },
      },
    ],
  },
  {
    id: 'natural-care',
    name: { ar: 'الرعاية الطبيعية', en: 'Natural Care' },
    description: {
      ar: 'برامج رعاية طبيعية مرتبطة بخطط الأكاديمية.',
      en: 'Natural care programs linked to academy care plans.',
    },
    image: 'https://picsum.photos/seed/clinic-general-2/800/500',
    services: [
      {
        name: { ar: 'خطة علاجية', en: 'Care plan' },
        description: { ar: 'خطة مخصصة بعد الاستشارة الأولية.', en: 'Personalized plan after the initial consultation.' },
      },
      {
        name: { ar: 'تقييم أعشاب', en: 'Herbal assessment' },
        description: { ar: 'مراجعة استخدام الأعشاب والمكملات.', en: 'Review of herbs and supplements usage.' },
      },
    ],
  },
];

export function getDoctorConsultationTypes(doctorId: string) {
  return (DOCTOR_CONSULTATION_TYPES[doctorId] ?? []).filter((item) => item.isActive);
}

export function getConsultationTypeConfig(doctorId: string, format: 'video' | 'text') {
  return getDoctorConsultationTypes(doctorId).find((item) => item.format === format);
}

export function getScheduleConfig(
  doctorId: string,
  serviceKind: ConsultationKind,
  clinicId?: string,
): DoctorScheduleConfig | undefined {
  const matches = DEFAULT_SCHEDULES.filter(
    (config) =>
      config.doctorId === doctorId &&
      config.serviceKind === serviceKind &&
      (clinicId ? config.clinicId === clinicId || !config.clinicId : !config.clinicId),
  );
  if (clinicId) {
    const exact = matches.find((config) => config.clinicId === clinicId);
    if (exact) return exact;
  }
  return matches[0];
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatDisplayDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function generateSlotCandidates(
  config: DoctorScheduleConfig,
  now: Date = new Date(),
): Array<{ date: string; time: string; duration: number }> {
  const slots: Array<{ date: string; time: string; duration: number }> = [];
  const startDay = new Date(now);
  startDay.setHours(0, 0, 0, 0);
  startDay.setDate(startDay.getDate() + config.minLeadDays);

  const dayStartMinutes = parseTimeToMinutes(config.dayStart);
  const dayEndMinutes = parseTimeToMinutes(config.dayEnd);

  for (let offset = 0; offset < config.horizonDays; offset += 1) {
    const day = new Date(startDay);
    day.setDate(startDay.getDate() + offset);
    if (!config.workingDays.includes(day.getDay())) continue;

    for (
      let minute = dayStartMinutes;
      minute + config.durationMinutes <= dayEndMinutes;
      minute += config.slotIntervalMinutes
    ) {
      const slotDate = formatDisplayDate(day);
      const slotTime = formatMinutesToTime(minute);
      const slotStart = new Date(`${slotDate}T${slotTime}`);
      if (slotStart.getTime() <= now.getTime()) continue;
      slots.push({ date: slotDate, time: slotTime, duration: config.durationMinutes });
    }
  }

  return slots;
}

export function buildSlotId(
  doctorId: string,
  serviceKind: ConsultationKind,
  date: string,
  time: string,
  clinicId?: string,
) {
  const clinicPart = clinicId ? `-${clinicId}` : '';
  return `slot-${doctorId}-${serviceKind}${clinicPart}-${date}-${time.replace(':', '')}`;
}
