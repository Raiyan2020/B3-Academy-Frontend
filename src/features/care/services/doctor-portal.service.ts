'use client';

import { getStoredConsultations } from '@/features/care/services/care-records-storage.service';
import type { StoredConsultationRecord } from '@/features/care/types/care.types';
import { listCareDoctors } from '@/features/care/services/care-data.service';

const USER_DOCTOR_MAP: Record<string, string> = {
  doctor1: 'dr-sarah',
};

export function resolveDoctorProfileId(userId: string) {
  return USER_DOCTOR_MAP[userId] ?? listCareDoctors()[0]?.id ?? null;
}

export function listDoctorAppointments(doctorUserId: string): StoredConsultationRecord[] {
  const doctorId = resolveDoctorProfileId(doctorUserId);
  if (!doctorId) return [];
  return getStoredConsultations().filter((record) => record.doctorId === doctorId);
}

export function getDoctorAppointment(id: string, doctorUserId: string) {
  const doctorId = resolveDoctorProfileId(doctorUserId);
  const record = getStoredConsultations().find((item) => item.id === id);
  if (!record || record.doctorId !== doctorId) return null;
  return record;
}
