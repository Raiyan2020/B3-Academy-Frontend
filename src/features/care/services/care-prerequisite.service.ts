import { getClinicById } from './care-data.service';
import { getStoredConsultations } from './care-records-storage.service';
import { withDerivedConsultationStatus } from './consultation-lifecycle.service';

export type PrerequisiteStatus = 'missing' | 'scheduled' | 'completed' | 'unavailable';

function resolveConsultationPrerequisiteStatus(
  records: ReturnType<typeof getStoredConsultations>,
): PrerequisiteStatus {
  if (records.length === 0) return 'missing';

  const active = records
    .map((record) => withDerivedConsultationStatus(record))
    .filter((record) => record.status !== 'cancelled');
  if (active.length === 0) return 'unavailable';

  if (active.some((record) => record.status === 'completed')) return 'completed';
  if (active.some((record) => record.status === 'scheduled' || record.status === 'purchased')) {
    return 'scheduled';
  }

  return 'unavailable';
}

export function evaluateClinicInitialConsultation(userId: string, clinicId: string): PrerequisiteStatus {
  const clinic = getClinicById(clinicId);
  if (!clinic) return 'unavailable';

  const records = getStoredConsultations(userId).filter(
    (record) =>
      record.clinicId === clinicId &&
      (record.serviceKind === 'clinic_initial' ||
        record.serviceName.en.toLowerCase().includes('clinic initial')),
  );

  return resolveConsultationPrerequisiteStatus(records);
}

export function evaluateTripInitialConsultation(userId: string): PrerequisiteStatus {
  const records = getStoredConsultations(userId).filter(
    (record) =>
      record.serviceKind === 'trip_initial' ||
      record.serviceName.en.toLowerCase().includes('trip initial'),
  );

  return resolveConsultationPrerequisiteStatus(records);
}

export function isPrerequisiteSatisfied(status: PrerequisiteStatus) {
  return status === 'completed';
}
