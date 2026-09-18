import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bookIndividualConsultation,
  fulfillIndividualConsultationSlot,
  getConsultationAvailableSlots,
  getConsultationCatalogDoctors,
  getDoctorConsultationPackages,
  getIndividualConsultationTypes,
  purchaseConsultationPackage,
} from '../services/consultations-catalog.service';
import type { BookIndividualConsultationInput, FulfillSlotInput, PurchaseConsultationPackageInput } from '../types/catalog.types';
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

export function useDoctorConsultationPackages(doctorId: string, page?: number, perPage = 50) {
  return useQuery({
    queryKey: consultationCatalogKeys.packages(doctorId, page),
    queryFn: () => getDoctorConsultationPackages(doctorId, { page, perPage }),
    enabled: Boolean(doctorId),
  });
}

// --- Booking (auth) ---

export function useBookIndividualConsultation(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BookIndividualConsultationInput) => bookIndividualConsultation(doctorId, input),
    meta: { successMessage: { ar: 'تم إرسال طلب حجز الاستشارة.', en: 'Consultation booking submitted.' } },
    onSuccess: () => {
      // Prefix-match every available-slots query for this doctor, regardless of date/type.
      void queryClient.invalidateQueries({ queryKey: [...consultationCatalogKeys.doctors(), doctorId, 'available-slots'] });
    },
  });
}

export function useFulfillIndividualConsultationSlot(doctorId: string) {
  return useMutation({
    mutationFn: (input: FulfillSlotInput) => fulfillIndividualConsultationSlot(doctorId, input),
    meta: { successMessage: { ar: 'تم تأكيد الموعد.', en: 'Slot confirmed.' } },
  });
}

export function usePurchaseConsultationPackage(doctorId: string, packageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseConsultationPackageInput) => purchaseConsultationPackage(doctorId, packageId, input),
    meta: { successMessage: { ar: 'تم إرسال طلب شراء باقة الاستشارات.', en: 'Consultation package purchase submitted.' } },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['account-consultations'] });
      void queryClient.invalidateQueries({ queryKey: ['care-portal'] });
    },
  });
}
