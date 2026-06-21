import type { ClinicRecord, ConsultationPackageRecord, DoctorProfile, TripPackageRecord } from '../types/care.types';

export const CARE_DOCTORS: DoctorProfile[] = [
  {
    id: 'dr-sarah',
    name: { ar: 'د. سارة أحمد', en: 'Dr. Sarah Ahmed' },
    avatar: 'https://picsum.photos/seed/dr-sarah/200/200',
    bio: { ar: 'مختصة في الرعاية الطبيعية والاستشارات الأولية.', en: 'Specialist in natural care and initial consultations.' },
    clinicId: 'clinic-riyadh',
  },
  {
    id: 'dr-ali',
    name: { ar: 'د. علي حسن', en: 'Dr. Ali Hassan' },
    avatar: 'https://picsum.photos/seed/dr-ali/200/200',
    bio: { ar: 'مختص في الاستشارات النصية والمرئية العامة.', en: 'Specialist in text and video consultations.' },
    clinicId: 'clinic-dubai',
  },
];

export const CLINICS: ClinicRecord[] = [
  {
    id: 'clinic-riyadh',
    name: { ar: 'عيادة الرياض الطبيعية', en: 'Riyadh Natural Clinic' },
    category: { ar: 'رعاية طبيعية', en: 'Natural Care' },
    image: 'https://picsum.photos/seed/clinic-riyadh/900/600',
    address: 'Riyadh, King Fahd Road',
    shortDescription: { ar: 'عيادة للاستشارات والفحوصات الطبيعية.', en: 'Clinic for natural consultations and assessments.' },
    description: { ar: 'تقدم العيادة رعاية طبيعية مرتبطة بخطة المنصة، ويتم الحجز والدفع من داخل المنصة فقط.', en: 'The clinic provides natural care through the platform, with booking and payment inside the platform only.' },
    specialties: { ar: 'استشارات أولية، متابعة، تقييمات رعاية طبيعية.', en: 'Initial consultations, follow-up, and natural care assessments.' },
    doctor: CARE_DOCTORS[0],
    price: 220,
    isActive: true,
  },
  {
    id: 'clinic-dubai',
    name: { ar: 'عيادة دبي التكاملية', en: 'Dubai Integrative Clinic' },
    category: { ar: 'رعاية تكاملية', en: 'Integrative Care' },
    image: 'https://picsum.photos/seed/clinic-dubai/900/600',
    address: 'Dubai, Jumeirah',
    shortDescription: { ar: 'عيادة مرتبطة بطبيب واحد ومسار حجز مباشر.', en: 'Clinic linked to one doctor and a direct booking flow.' },
    description: { ar: 'لا تعرض العيادة وسائل تواصل مباشرة، وتظهر المواعيد فقط داخل مسار الحجز.', en: 'No direct contact details are shown; availability appears only during booking.' },
    specialties: { ar: 'استشارات مرئية ونصية ومتابعات عيادة.', en: 'Video, text consultations, and clinic follow-ups.' },
    doctor: CARE_DOCTORS[1],
    price: 250,
    isActive: true,
  },
];

export const CONSULTATION_PACKAGES: ConsultationPackageRecord[] = [
  {
    id: 'pkg-sarah-4',
    doctorId: 'dr-sarah',
    name: { ar: 'باقة متابعة من 4 جلسات', en: 'Four-session follow-up package' },
    description: { ar: 'أربع جلسات مع الطبيب نفسه، يتم حجز كل جلسة حسب المواعيد المتاحة.', en: 'Four sessions with the same doctor, booked according to availability.' },
    sessionCount: 4,
    sessionDurationMinutes: 45,
    price: 420,
    isActive: true,
  },
  {
    id: 'pkg-ali-6',
    doctorId: 'dr-ali',
    name: { ar: 'باقة استشارات نصية', en: 'Text consultation package' },
    description: { ar: 'ست جلسات نصية مع سجل قراءة بعد انتهاء كل جلسة.', en: 'Six text sessions with read-only history after each session.' },
    sessionCount: 6,
    sessionDurationMinutes: 30,
    price: 360,
    isActive: true,
  },
];

export const TRIP_PACKAGES: TripPackageRecord[] = [
  {
    id: 'trip-amazon',
    title: { ar: 'رحلة الأمازون الشفائية', en: 'Amazon Healing Expedition' },
    description: { ar: 'باقة رحلة يتم تنفيذها بالتنسيق مع الإدارة بعد الشراء.', en: 'A trip package coordinated by administration after purchase.' },
    image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80',
    place: { ar: 'بيرو', en: 'Peru' },
    durationDays: 7,
    price: 2450,
    availableSeats: 8,
    category: 'retreat',
    features: [
      { ar: 'تنسيق كامل مع الإدارة', en: 'Full coordination with administration' },
      { ar: 'برنامج تعريفي ورعاية متابعة', en: 'Introductory program and follow-up care' },
    ],
    isActive: true,
  },
  {
    id: 'trip-mountains',
    title: { ar: 'خلوة الجبال الطبية', en: 'Mountain Medicinal Retreat' },
    description: { ar: 'رحلة تعليمية ورعائية خارج المنصة بعد شراء الباقة.', en: 'An educational care trip coordinated outside the platform after purchase.' },
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80',
    place: { ar: 'الألب', en: 'Alps' },
    durationDays: 5,
    price: 1800,
    availableSeats: 4,
    category: 'mountain',
    features: [
      { ar: 'مدة واضحة وعدد مقاعد محدود', en: 'Clear duration and limited seats' },
      { ar: 'فاتورة بعد الدفع الناجح', en: 'Invoice after successful payment' },
    ],
    isActive: true,
  },
];

export function getActiveClinics() {
  return CLINICS.filter((clinic) => clinic.isActive);
}

export function getClinicById(id?: string) {
  return getActiveClinics().find((clinic) => clinic.id === id);
}

export function getActiveConsultationPackages() {
  return CONSULTATION_PACKAGES.filter((item) => item.isActive);
}

export function getActiveTripPackages() {
  return TRIP_PACKAGES.filter((item) => item.isActive);
}

