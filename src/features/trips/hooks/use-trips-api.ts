'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bookTripInitialConsultation,
  fulfillTripInitialConsultationSlot,
  getAccountTripPackage,
  getAccountTripPackages,
  getFeaturedTrips,
  getTripAvailableSlots,
  getTripCategories,
  getTripDetail,
  getTripInitialConsultation,
  getTripInitialConsultationMessages,
  getTripInitialConsultationTypes,
  getTripInitialConsultations,
  getTrips,
  purchaseTrip,
  sendTripInitialConsultationMessage,
} from '../services/trips-api.service';
import type {
  BookTripInitialConsultationInput,
  FulfillSlotInput,
  PurchaseTripInput,
} from '../types/api.types';
import { tripKeys } from '../query-keys';

// --- Catalog ---

export function useTrips(search?: string) {
  return useQuery({
    queryKey: tripKeys.list({ search: search || 'all' }),
    queryFn: () => getTrips({ search }),
  });
}

export function useFeaturedTrips(limit = 4) {
  return useQuery({
    queryKey: tripKeys.featured(limit),
    queryFn: () => getFeaturedTrips(limit),
  });
}

export function useTripCategories() {
  return useQuery({
    queryKey: tripKeys.categories(),
    queryFn: getTripCategories,
  });
}

export function useTripPackageDetail(id: string) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => getTripDetail(id),
    enabled: Boolean(id),
  });
}

// --- Initial consultation ---

export function useTripInitialConsultationTypes(enabled = true) {
  return useQuery({
    queryKey: tripKeys.initialConsultationTypes(),
    queryFn: getTripInitialConsultationTypes,
    enabled,
  });
}

export function useTripAvailableSlots(date?: string, type?: string) {
  return useQuery({
    queryKey: tripKeys.availableSlots(date, type),
    queryFn: () => getTripAvailableSlots({ date: date!, type: type! }),
    enabled: Boolean(date && type),
  });
}

export function useBookTripInitialConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BookTripInitialConsultationInput) => bookTripInitialConsultation(input),
    meta: { successMessage: 'Consultation booking submitted.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.consultations() });
    },
  });
}

export function useFulfillTripInitialConsultationSlot() {
  return useMutation({
    mutationFn: (input: FulfillSlotInput) => fulfillTripInitialConsultationSlot(input),
    meta: { successMessage: 'Slot confirmed.' },
  });
}

// --- Purchase ---

export function usePurchaseTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseTripInput) => purchaseTrip(tripId, input),
    meta: { successMessage: 'Purchase request created.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      void queryClient.invalidateQueries({ queryKey: tripKeys.accountOrders() });
    },
  });
}

// --- Trip initial consultation care portal ---

export function useTripInitialConsultations(page?: number) {
  return useQuery({
    queryKey: [...tripKeys.consultations(), page ?? 1],
    queryFn: () => getTripInitialConsultations({ page }),
  });
}

export function useTripInitialConsultation(id: string) {
  return useQuery({
    queryKey: tripKeys.consultation(id),
    queryFn: () => getTripInitialConsultation(id),
    enabled: Boolean(id),
  });
}

export function useTripInitialConsultationMessages(id: string) {
  return useQuery({
    queryKey: tripKeys.consultationMessages(id),
    queryFn: () => getTripInitialConsultationMessages(id),
    enabled: Boolean(id),
  });
}

export function useSendTripInitialConsultationMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendTripInitialConsultationMessage(id, body),
    meta: { successMessage: 'Message sent.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.consultationMessages(id) });
    },
  });
}

// --- Account trip-packages ---

export function useAccountTripPackages(page?: number) {
  return useQuery({
    queryKey: [...tripKeys.accountOrders(), page ?? 1],
    queryFn: () => getAccountTripPackages({ page }),
  });
}

export function useAccountTripPackage(orderId: string) {
  return useQuery({
    queryKey: tripKeys.accountOrder(orderId),
    queryFn: () => getAccountTripPackage(orderId),
    enabled: Boolean(orderId),
  });
}
