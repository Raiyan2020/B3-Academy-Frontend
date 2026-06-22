'use client';

import { getStoredClinicBookings, getStoredConsultations } from './care-records-storage.service';
import { withDerivedConsultationStatus } from './consultation-lifecycle.service';
import { withDerivedClinicBookingStatus } from './clinic-lifecycle.service';

function isUpcomingClinicBooking(status: string) {
  return status === 'scheduled';
}

function isUpcomingConsultation(record: ReturnType<typeof withDerivedConsultationStatus>) {
  if (record.kind === 'package') return false;
  return record.status === 'scheduled' || record.status === 'purchased';
}

export function countActiveClinicBookings(userId: string) {
  return getStoredClinicBookings(userId)
    .map((booking) => withDerivedClinicBookingStatus(booking))
    .filter((booking) => isUpcomingClinicBooking(booking.status)).length;
}

export function canBookClinicAppointment(userId: string) {
  return countActiveClinicBookings(userId) < 2;
}

export function countUpcomingIndividualConsultations(userId: string) {
  return getStoredConsultations(userId)
    .map((record) => withDerivedConsultationStatus(record))
    .filter((record) => record.kind !== 'package' && isUpcomingConsultation(record)).length;
}

export function canBookIndividualConsultation(userId: string) {
  return countUpcomingIndividualConsultations(userId) < 2;
}

export function countActivePackages(userId: string) {
  return getStoredConsultations(userId).filter(
    (record) =>
      record.kind === 'package' &&
      record.status !== 'cancelled' &&
      record.status !== 'completed' &&
      (record.remainingSessions ?? 0) > 0,
  ).length;
}

export function canPurchaseConsultationPackage(userId: string) {
  return countActivePackages(userId) < 2;
}
