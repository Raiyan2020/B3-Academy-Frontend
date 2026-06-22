import { describe, expect, it } from 'vitest';
import { addStoredConsultation, getStoredConsultations } from './care-records-storage.service';
import { getAvailableSlots, getSlotById, reserveSlot, resetSlotRepositoryForTests } from './slot-repository.service';

describe('slot repository', () => {
  it('keeps selected slot data identical to the created consultation record', () => {
    resetSlotRepositoryForTests();
    const [slot] = getAvailableSlots({ doctorId: 'dr-sarah', serviceKind: 'individual_video' });
    expect(slot).toBeDefined();

    const created = addStoredConsultation({
      userId: 'user-1',
      doctorName: { ar: 'د. سارة أحمد', en: 'Dr. Sarah Ahmed' },
      serviceName: { ar: 'استشارة مرئية فردية', en: 'Individual video consultation' },
      kind: 'individual-video',
      serviceKind: slot.serviceKind,
      date: slot.date,
      time: slot.time,
      slotId: slot.id,
      timezone: slot.timezone,
      duration: slot.duration,
      price: 150,
      status: 'scheduled',
      bookingStatus: 'confirmed',
      doctorId: slot.doctorId,
    });

    expect(reserveSlot(slot.id)).toBe(true);
    expect(getSlotById(slot.id)?.status).toBe('booked');

    const stored = getStoredConsultations('user-1')[0];
    expect(stored.slotId).toBe(slot.id);
    expect(stored.date).toBe(slot.date);
    expect(stored.time).toBe(slot.time);
    expect(stored.timezone).toBe(slot.timezone);
    expect(created.slotId).toBe(slot.id);
    expect(created.date).toBe(slot.date);
    expect(created.time).toBe(slot.time);
  });
});
