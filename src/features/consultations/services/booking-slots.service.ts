import {
  getAvailableSlots,
  getSlotById,
  type AvailabilitySlotFilters,
} from '@/features/care/services/slot-repository.service';
import type { AvailabilitySlot } from '@/features/care/types/care.types';

export function getBookingSlots(filters: AvailabilitySlotFilters = {}) {
  return getAvailableSlots(filters);
}

export function getAvailableBookingSlots(filters: AvailabilitySlotFilters = {}) {
  return getAvailableSlots(filters);
}

export function getBookingSlotById(id: string): AvailabilitySlot | null {
  return getSlotById(id);
}
