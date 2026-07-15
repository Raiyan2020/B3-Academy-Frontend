'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bookClinicAppointment,
  bookInitialConsultation,
  fulfillAppointmentSlot,
  fulfillInitialConsultationSlot,
} from '../services/clinic-booking-api.service';
import type {
  BookClinicAppointmentInput,
  BookInitialConsultationInput,
  FulfillSlotInput,
} from '../types/api.types';
import { clinicKeys } from '../query-keys';

export function useBookInitialConsultation(clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BookInitialConsultationInput) => bookInitialConsultation(clinicId, input),
    meta: { successMessage: 'Consultation booking submitted.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clinicKeys.detail(clinicId) });
    },
  });
}

export function useBookClinicAppointment(clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BookClinicAppointmentInput) => bookClinicAppointment(clinicId, input),
    meta: { successMessage: 'Appointment booking submitted.' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clinicKeys.detail(clinicId) });
    },
  });
}

export function useFulfillInitialConsultationSlot(clinicId: string) {
  return useMutation({
    mutationFn: (input: FulfillSlotInput) => fulfillInitialConsultationSlot(clinicId, input),
    meta: { successMessage: 'Slot confirmed.' },
  });
}

export function useFulfillAppointmentSlot(clinicId: string) {
  return useMutation({
    mutationFn: (input: FulfillSlotInput) => fulfillAppointmentSlot(clinicId, input),
    meta: { successMessage: 'Slot confirmed.' },
  });
}
