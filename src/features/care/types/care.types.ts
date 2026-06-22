import type { LocalizedString } from '../../../../types';
import type { BookingStatus, ConsultationKind } from '@/features/business/status.types';

export type { BookingStatus, ConsultationKind };

export type SlotStatus = 'available' | 'booked' | 'blocked' | 'expired';

export interface AvailabilitySlot {
  id: string;
  doctorId: string;
  serviceKind: ConsultationKind;
  clinicId?: string;
  tripId?: string;
  date: string;
  time: string;
  duration: number;
  timezone: string;
  status: SlotStatus;
}

export interface DoctorProfile {
  id: string;
  name: LocalizedString;
  avatar: string;
  bio: LocalizedString;
  clinicId?: string;
  isActive?: boolean;
}

export interface ClinicRecord {
  id: string;
  name: LocalizedString;
  category: LocalizedString;
  image: string;
  address: string;
  shortDescription: LocalizedString;
  description: LocalizedString;
  specialties: LocalizedString;
  doctor: DoctorProfile;
  price: number;
  isActive: boolean;
}

export interface ConsultationPackageRecord {
  id: string;
  doctorId: string;
  name: LocalizedString;
  description: LocalizedString;
  sessionCount: number;
  sessionDurationMinutes: number;
  sessionIntervalDays: number;
  price: number;
  isActive: boolean;
}

export interface TripPackageRecord {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  image: string;
  place: LocalizedString;
  durationDays: number;
  price: number;
  availableSeats: number;
  category: string;
  features: LocalizedString[];
  isActive: boolean;
  isFeatured?: boolean;
}

export type ConsultationRecordKind = 'individual-video' | 'individual-text' | 'package';
export type CareRecordStatus = 'scheduled' | 'purchased' | 'completed' | 'cancelled' | 'missed';

export interface StoredConsultationRecord {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: LocalizedString;
  serviceName: LocalizedString;
  kind: ConsultationRecordKind;
  serviceKind?: ConsultationKind;
  date: string;
  time: string;
  slotId?: string;
  timezone?: string;
  duration?: number;
  price: number;
  status: CareRecordStatus;
  bookingStatus?: BookingStatus;
  paymentId?: string;
  packageId?: string;
  sessionCount?: number;
  remainingSessions?: number;
  portalHref?: string;
  portalEnteredAt?: string;
  clinicId?: string;
  tripId?: string;
  createdAt: string;
}

export interface StoredTripPurchaseRecord {
  id: string;
  userId: string;
  tripId: string;
  title: LocalizedString;
  place: LocalizedString;
  price: number;
  currency?: string;
  image?: string;
  durationDays?: number;
  category?: string;
  features?: LocalizedString[];
  status: CareRecordStatus;
  bookingStatus?: BookingStatus;
  paymentId?: string;
  slotId?: string;
  timezone?: string;
  coordinationNote: LocalizedString;
  purchasedAt: string;
  adminNotifyPending?: boolean;
}

export interface StoredClinicBookingRecord {
  id: string;
  userId: string;
  clinicId: string;
  doctorId: string;
  serviceName: LocalizedString;
  doctorName: LocalizedString;
  location: string;
  date: string;
  time: string;
  slotId?: string;
  timezone?: string;
  duration?: number;
  price: number;
  status: CareRecordStatus;
  bookingStatus?: BookingStatus;
  paymentId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
  createdAt: string;
}

export interface StoredPackageSessionRecord {
  id: string;
  userId: string;
  packageId: string;
  consultationId: string;
  doctorId: string;
  slotId: string;
  date: string;
  time: string;
  timezone: string;
  duration: number;
  sessionFormat: 'video' | 'text';
  status: BookingStatus;
  createdAt: string;
}
