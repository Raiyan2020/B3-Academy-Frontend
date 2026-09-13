import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bookIndividualConsultation,
  fulfillIndividualConsultationSlot,
  getConsultationAvailableSlots,
  getConsultationCatalogDoctors,
  getDoctorConsultationPackages,
  getIndividualConsultationTypes,
} from '../services/consultations-catalog.service';
import type { BookIndividualConsultationInput, FulfillSlotInput } from '../types/catalog.types';
import { consultationCatalogKeys } from '../query-keys';

// --- Catalog (public) ---

export function useConsultationCatalogDoctors(search?: string, page?: number) {
  return useQuery({
    queryKey: consultationCatalogKeys.doctorList(search, page),
    queryFn: () => getConsultationCatalogDoctors({ search, page }),
  });
}

export function useIndividualConsultationTypes(doctorId: string) {
  return useQuery({
    queryKey: consultationCatalogKeys.consultationTypes(doctorId),
    queryFn: () => getIndividualConsultationTypes(doctorId),
    enabled: Boolean(doctorId),
  });
}

export function useConsultationAvailableSlots(doctorId: string, date?: string, type?: string) {
  return useQuery({
    queryKey: consultationCatalogKeys.availableSlots(doctorId, date, type),
    queryFn: () => getConsultationAvailableSlots(doctorId, { date: date!, type: type! }),
    enabled: Boolean(doctorId && date && type),
  });
}

export function useDoctorConsultationPackages(doctorId: string, page?: number) {
  return useQuery({
    queryKey: consultationCatalogKeys.packages(doctorId, page),
    queryFn: () => getDoctorConsultationPackages(doctorId, { page }),
    enabled: Boolean(doctorId),
  });
}

// --- Booking (auth) ---

export function useBookIndividualConsultation(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BookIndividualConsultationInput) => bookIndividualConsultation(doctorId, input),
    meta: { successMessage: 'Consultation booking submitted.' },
    onSuccess: () => {
      // Prefix-match every available-slots query for this doctor, regardless of date/type.
      void queryClient.invalidateQueries({ queryKey: [...consultationCatalogKeys.doctors(), doctorId, 'available-slots'] });
    },
  });
}

export function useFulfillIndividualConsultationSlot(doctorId: string) {
  return useMutation({
    mutationFn: (input: FulfillSlotInput) => fulfillIndividualConsultationSlot(doctorId, input),
    meta: { successMessage: 'Slot confirmed.' },
  });
}
