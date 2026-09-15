'use client';

import { ApiIndividualBookingFlow } from './api-individual-booking-flow';

interface IndividualBookingFlowProps {
  doctorId: string;
}

/** All individual consultation bookings go through the real API-backed flow. */
export function IndividualBookingFlow({ doctorId }: IndividualBookingFlowProps) {
  return <ApiIndividualBookingFlow doctorId={doctorId} />;
}
