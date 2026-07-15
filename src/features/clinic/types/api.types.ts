// Frontend-normalized types for the backend Clinics + care-booking API.
// Backend resources return already-localized plain strings for name/label fields.

export interface ClinicCategory {
  id: string;
  name: string;
}

export interface GeneralClinicService {
  id: string;
  name: string;
  description: string;
  image: string | null;
}

export interface ClinicListItem {
  id: string;
  name: string;
  image: string | null;
  address: string;
  shortDescription: string;
  category: ClinicCategory | null;
}

export interface ClinicDoctor {
  id: string;
  name: string;
  image: string | null;
  shortBio: string;
}

export interface WorkingHoursPeriod {
  startTime: string;
  endTime: string;
}

export interface WorkingHoursDay {
  day: string;
  dayLabel: string;
  isOff: boolean;
  periods: WorkingHoursPeriod[];
}

/** Present only when the clinic request is authenticated and the clinic has a doctor. */
export interface ClinicInitialConsultationState {
  status: string | null;
  statusLabel: string | null;
  canBook: boolean;
  careBookingId: string | null;
  paymentRef: string | null;
  portalState: string | null;
}

export interface ClinicDetail extends ClinicListItem {
  description: string;
  services: unknown;
  isFavorited: boolean;
  doctor: ClinicDoctor | null;
  workingHours: WorkingHoursDay[];
  // Auth-only augmentation:
  initialConsultation: ClinicInitialConsultationState | null;
  hasCompletedInitialConsultation: boolean;
  canBookInClinic: boolean;
}

/** `type` value used by the `book` endpoint body. */
export type InitialConsultationType = 'text' | 'video';

/** `type` value used by the `available-slots` endpoint. */
export type ClinicCareBookingType =
  | 'in_clinic'
  | 'clinic_text_initial_consultation'
  | 'clinic_video_initial_consultation';

export interface InitialConsultationTypeOption {
  type: string; // short form from the IC-types endpoint: 'text' | 'video'
  typeLabel: string;
  isAvailable: boolean;
  price: number;
  durationMinutes: number | null;
  minimumBookingLeadDays: number;
}

export interface InitialConsultationTypes {
  clinicId: string;
  durationMinutes: number | null;
  types: InitialConsultationTypeOption[];
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}

export interface AvailableSlots {
  clinicId: string;
  date: string;
  type: string;
  typeLabel: string;
  minimumBookingLeadDays: number;
  durationMinutes: number | null;
  slots: AvailableSlot[];
}

// --- Booking + payment ---

export interface CareBooking {
  id: string;
  clinicId: string | null;
  doctorId: string | null;
  bookingType: string;
  bookingTypeLabel: string;
  appointmentDate: string | null;
  startTime: string | null;
  endTime: string | null;
  requiresSlotSelection: boolean;
  paymentRef: string | null;
  amount: number;
  currency: string;
  status: string;
  statusLabel: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  notes: string | null;
  completedAt: string | null;
  roomId: string | null;
  createdAt: string | null;
}

export interface PaymentTransaction {
  id: string;
  paymentRef: string | null;
  idempotencyKey: string | null;
  status: string;
  statusLabel: string;
  amount: number;
  baseAmount: number | null;
  currency: string;
  exchangeRate: number | null;
  driver: string | null;
  requiresSlotSelection: boolean;
  fulfillmentStatus: string | null;
  message: string;
  paymentUrl: string | null; // only when PENDING
  createdAt: string | null;
}

export interface BookingResult {
  payment: PaymentTransaction;
  careBooking: CareBooking | null;
}

export interface BookInitialConsultationInput {
  type: InitialConsultationType;
  appointmentDate: string; // Y-m-d
  startTime: string; // H:i
  paymentMethodId: string | number;
  currency: string;
  idempotencyKey: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  notes?: string;
  simulateResult?: 'success' | 'failed' | 'pending';
}

export type BookClinicAppointmentInput = Omit<BookInitialConsultationInput, 'type'>;

export interface FulfillSlotInput {
  paymentRef: string;
  appointmentDate: string; // Y-m-d
  startTime: string; // H:i
}
