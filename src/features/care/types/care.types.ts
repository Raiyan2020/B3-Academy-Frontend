import type { LocalizedString } from '../../../../types';

export interface DoctorProfile {
  id: string;
  name: LocalizedString;
  avatar: string;
  bio: LocalizedString;
  clinicId?: string;
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
}

export type ConsultationRecordKind = 'individual-video' | 'individual-text' | 'package';
export type CareRecordStatus = 'scheduled' | 'purchased' | 'completed' | 'cancelled';

export interface StoredConsultationRecord {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: LocalizedString;
  serviceName: LocalizedString;
  kind: ConsultationRecordKind;
  date: string;
  time: string;
  price: number;
  status: CareRecordStatus;
  paymentId?: string;
  packageId?: string;
  sessionCount?: number;
  remainingSessions?: number;
  portalHref?: string;
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
  status: CareRecordStatus;
  paymentId?: string;
  coordinationNote: LocalizedString;
  purchasedAt: string;
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
  price: number;
  status: CareRecordStatus;
  paymentId?: string;
  createdAt: string;
}
