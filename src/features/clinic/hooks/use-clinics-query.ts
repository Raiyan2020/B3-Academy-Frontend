'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getClinicAvailableSlots,
  getClinicCategories,
  getClinicDetail,
  getClinicServices,
  getClinicWorkingHours,
  getClinics,
  getInitialConsultationTypes,
} from '../services/clinics-api.service';
import { clinicKeys } from '../query-keys';

export function useClinics(search?: string) {
  return useQuery({
    queryKey: clinicKeys.list({ search: search || 'all' }),
    queryFn: () => getClinics({ search }),
  });
}

export function useClinicCategories() {
  return useQuery({
    queryKey: clinicKeys.categories(),
    queryFn: getClinicCategories,
  });
}

export function useClinicServices() {
  return useQuery({
    queryKey: clinicKeys.services(),
    queryFn: getClinicServices,
  });
}

export function useClinicDetail(id: string) {
  return useQuery({
    queryKey: clinicKeys.detail(id),
    queryFn: () => getClinicDetail(id),
    enabled: Boolean(id),
  });
}

export function useClinicWorkingHours(id: string) {
  return useQuery({
    queryKey: clinicKeys.workingHours(id),
    queryFn: () => getClinicWorkingHours(id),
    enabled: Boolean(id),
  });
}

export function useInitialConsultationTypes(id: string) {
  return useQuery({
    queryKey: clinicKeys.initialConsultationTypes(id),
    queryFn: () => getInitialConsultationTypes(id),
    enabled: Boolean(id),
  });
}

export function useClinicAvailableSlots(id: string, date?: string, type?: string) {
  return useQuery({
    queryKey: clinicKeys.availableSlots(id, date, type),
    queryFn: () => getClinicAvailableSlots(id, { date: date!, type: type! }),
    enabled: Boolean(id && date && type),
  });
}
