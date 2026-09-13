import { z } from 'zod';

// Response shapes for the new "consultations catalog" + "individual consultation booking"
// endpoints (see docs/modernization/backend-api-delta.md). Parsed at the service boundary
// so a shape drift fails loudly instead of silently producing `undefined` fields downstream.

const idSchema = z.union([z.string(), z.number()]);

// ClinicCategoryResource — pre-existing, unchanged; exact fields not re-derived by the delta
// doc, so kept loose/passthrough rather than guessed.
const clinicCategorySchema = z.looseObject({
  id: idSchema.optional(),
  name: z.string().optional(),
});

const catalogClinicSchema = z.object({
  id: idSchema,
  name: z.string(),
  image: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  category: clinicCategorySchema.nullable().optional(),
});

export const consultationCatalogDoctorSchema = z.object({
  id: idSchema,
  name: z.string(),
  image: z.string().nullable().optional(),
  brief: z.string().nullable().optional(),
  clinic: catalogClinicSchema.nullable().optional(),
  has_text_consultation: z.boolean(),
  has_video_consultation: z.boolean(),
});

export type ConsultationCatalogDoctorApi = z.infer<typeof consultationCatalogDoctorSchema>;

const consultationTypeOptionSchema = z.object({
  type: z.string(),
  type_label: z.string(),
  is_available: z.boolean(),
  price: z.number(),
  duration_minutes: z.number().nullable().optional(),
  minimum_booking_lead_days: z.number(),
});

export const individualConsultationTypesSchema = z.object({
  doctor_id: idSchema,
  clinic_id: idSchema.nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  types: z.array(consultationTypeOptionSchema),
});

export type IndividualConsultationTypesApi = z.infer<typeof individualConsultationTypesSchema>;

const availableSlotSchema = z.object({
  start_time: z.string(),
  end_time: z.string(),
});

export const availableSlotsSchema = z.object({
  doctor_id: idSchema,
  clinic_id: idSchema.nullable().optional(),
  date: z.string(),
  type: z.string(),
  type_label: z.string(),
  minimum_booking_lead_days: z.number(),
  duration_minutes: z.number().nullable().optional(),
  slots: z.array(availableSlotSchema),
});

export type AvailableSlotsApi = z.infer<typeof availableSlotsSchema>;

const packageDoctorSchema = z.object({
  id: idSchema,
  name: z.string(),
  image: z.string().nullable().optional(),
  short_bio: z.string().nullable().optional(),
});

export const consultationPackageSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().nullable().optional(),
  sessions_count: z.number(),
  total_price: z.number(),
  minimum_days_between_sessions: z.number(),
  doctor: packageDoctorSchema.nullable().optional(),
});

export type ConsultationPackageApi = z.infer<typeof consultationPackageSchema>;

// PaymentTransactionResource — pre-existing, unchanged.
export const paymentTransactionSchema = z.object({
  id: idSchema,
  payment_ref: z.string().nullable().optional(),
  idempotency_key: z.string().nullable().optional(),
  status: z.string(),
  status_label: z.string(),
  amount: z.number(),
  base_amount: z.number().nullable().optional(),
  currency: z.string(),
  exchange_rate: z.number().nullable().optional(),
  driver: z.string().nullable().optional(),
  payment_method: z.looseObject({}).nullable().optional(),
  requires_slot_selection: z.boolean(),
  fulfillment_status: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  payment_url: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export type PaymentTransactionApi = z.infer<typeof paymentTransactionSchema>;

// CareBookingResource — pre-existing, unchanged. `clinic`/`doctor`/`payment_transaction`/
// `invoice` are relation blocks whose exact shape isn't re-derived by the delta doc, so they
// stay loose/passthrough.
export const careBookingSchema = z.object({
  id: idSchema,
  clinic_id: idSchema.nullable().optional(),
  doctor_id: idSchema.nullable().optional(),
  booking_type: z.string(),
  booking_type_label: z.string(),
  appointment_date: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  requires_slot_selection: z.boolean(),
  payment_ref: z.string().nullable().optional(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  status_label: z.string(),
  user_name: z.string().nullable().optional(),
  user_email: z.string().nullable().optional(),
  user_phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  room_id: idSchema.nullable().optional(),
  clinic: z.looseObject({}).nullable().optional(),
  doctor: z.looseObject({}).nullable().optional(),
  payment_transaction: z.looseObject({}).nullable().optional(),
  invoice: z.looseObject({}).nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export type CareBookingApi = z.infer<typeof careBookingSchema>;

export const bookingResultSchema = z.object({
  payment: paymentTransactionSchema,
  care_booking: careBookingSchema.nullable(),
});

export type BookingResultApi = z.infer<typeof bookingResultSchema>;

// --- Frontend-normalized shapes -------------------------------------------------

export interface ConsultationCatalogDoctor {
  id: string;
  name: string;
  image: string | null;
  brief: string | null;
  clinic: {
    id: string;
    name: string;
    image: string | null;
    address: string | null;
    shortDescription: string | null;
    category: { id: string; name: string } | null;
  } | null;
  hasTextConsultation: boolean;
  hasVideoConsultation: boolean;
}

export interface IndividualConsultationTypeOption {
  type: string;
  typeLabel: string;
  isAvailable: boolean;
  price: number;
  durationMinutes: number | null;
  minimumBookingLeadDays: number;
}

export interface IndividualConsultationTypes {
  doctorId: string;
  clinicId: string | null;
  durationMinutes: number | null;
  types: IndividualConsultationTypeOption[];
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}

export interface AvailableSlots {
  doctorId: string;
  clinicId: string | null;
  date: string;
  type: string;
  typeLabel: string;
  minimumBookingLeadDays: number;
  durationMinutes: number | null;
  slots: AvailableSlot[];
}

export interface ConsultationPackage {
  id: string;
  name: string;
  description: string | null;
  sessionsCount: number;
  totalPrice: number;
  minimumDaysBetweenSessions: number;
  doctor: { id: string; name: string; image: string | null; shortBio: string | null } | null;
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
  message: string | null;
  paymentUrl: string | null;
  createdAt: string | null;
}

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

export interface BookingResult {
  payment: PaymentTransaction;
  careBooking: CareBooking | null;
}

// `type` accepted by book / available-slots / consultation-types.
export type IndividualConsultationType = 'individual_text_consultation' | 'individual_video_consultation';

export interface BookIndividualConsultationInput {
  type: IndividualConsultationType;
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

export interface FulfillSlotInput {
  paymentRef: string;
  appointmentDate: string; // Y-m-d
  startTime: string; // H:i
}
