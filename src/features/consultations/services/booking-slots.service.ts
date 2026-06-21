import { MOCK_SLOTS } from '../data/booking-slots.mock';

export function getBookingSlots() {
  return MOCK_SLOTS;
}

export function getAvailableBookingSlots() {
  return MOCK_SLOTS.filter((slot) => slot.available);
}
