import { z } from 'zod';
import { apiFetch } from '@/lib/api/base-fetch';
import {
  availableSlotsSchema,
  bookingResultSchema,
  consultationCatalogDoctorSchema,
  consultationPackageSchema,
  individualConsultationTypesSchema,
  paymentTransactionSchema,
  type AvailableSlots,
  type BookIndividualConsultationInput,
  type BookingResult,
  type CareBooking,
  type CareBookingApi,
  type ConsultationCatalogDoctor,
  type ConsultationPackage,
  type FulfillSlotInput,
  type IndividualConsultationTypes,
  type PaymentTransaction,
  type PaymentTransactionApi,
  type ConsultationPackagePurchaseResult,
  type PurchaseConsultationPackageInput,
} from '../types/catalog.types';

const paginationSchema = z.object({
  current_page: z.number(),
  last_page: z.number(),
  per_page: z.number(),
  total: z.number(),
});

export interface Pagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

function mapPagination(raw: z.infer<typeof paginationSchema>): Pagination {
  return {
    currentPage: raw.current_page,
    lastPage: raw.last_page,
    perPage: raw.per_page,
    total: raw.total,
  };
}

function mapDoctor(item: z.infer<typeof consultationCatalogDoctorSchema>): ConsultationCatalogDoctor {
  return {
    id: String(item.id),
    name: item.name,
    image: item.image ?? null,
    brief: item.brief ?? null,
    clinic: item.clinic
      ? {
          id: String(item.clinic.id),
          name: item.clinic.name,
          image: item.clinic.image ?? null,
          address: item.clinic.address ?? null,
          shortDescription: item.clinic.short_description ?? null,
          category: item.clinic.category
            ? { id: String(item.clinic.category.id ?? ''), name: item.clinic.category.name ?? '' }
            : null,
        }
      : null,
    hasTextConsultation: item.has_text_consultation,
    hasVideoConsultation: item.has_video_consultation,
  };
}

function mapConsultationTypes(item: z.infer<typeof individualConsultationTypesSchema>): IndividualConsultationTypes {
  return {
    doctorId: String(item.doctor_id),
    clinicId: item.clinic_id != null ? String(item.clinic_id) : null,
    durationMinutes: item.duration_minutes ?? null,
    types: item.types.map((type) => ({
      type: type.type,
      typeLabel: type.type_label,
      isAvailable: type.is_available,
      price: type.price,
      durationMinutes: type.duration_minutes ?? null,
      minimumBookingLeadDays: type.minimum_booking_lead_days,
    })),
  };
}

function mapAvailableSlots(item: z.infer<typeof availableSlotsSchema>): AvailableSlots {
  return {
    doctorId: String(item.doctor_id),
    clinicId: item.clinic_id != null ? String(item.clinic_id) : null,
    date: item.date,
    type: item.type,
    typeLabel: item.type_label,
    minimumBookingLeadDays: item.minimum_booking_lead_days,
    durationMinutes: item.duration_minutes ?? null,
    slots: item.slots.map((slot) => ({ startTime: slot.start_time, endTime: slot.end_time })),
  };
}

function mapPackage(item: z.infer<typeof consultationPackageSchema>): ConsultationPackage {
  return {
    id: String(item.id),
    name: item.name,
    description: item.description ?? null,
    sessionsCount: item.sessions_count,
    totalPrice: item.total_price,
    minimumDaysBetweenSessions: item.minimum_days_between_sessions,
    doctor: item.doctor
      ? { id: String(item.doctor.id), name: item.doctor.name, image: item.doctor.image ?? null, shortBio: item.doctor.short_bio ?? null }
      : null,
  };
}

function mapPaymentTransaction(item: PaymentTransactionApi): PaymentTransaction {
  return {
    id: String(item.id),
    paymentRef: item.payment_ref ?? null,
    idempotencyKey: item.idempotency_key ?? null,
    status: item.status,
    statusLabel: item.status_label,
    amount: item.amount,
    baseAmount: item.base_amount ?? null,
    currency: item.currency,
    exchangeRate: item.exchange_rate ?? null,
    driver: item.driver ?? null,
    requiresSlotSelection: item.requires_slot_selection,
    fulfillmentStatus: item.fulfillment_status ?? null,
    message: item.message ?? null,
    paymentUrl: item.payment_url ?? null,
    createdAt: item.created_at ?? null,
  };
}

function mapCareBooking(item: CareBookingApi | null): CareBooking | null {
  if (!item) return null;
  return {
    id: String(item.id),
    clinicId: item.clinic_id != null ? String(item.clinic_id) : null,
    doctorId: item.doctor_id != null ? String(item.doctor_id) : null,
    bookingType: item.booking_type,
    bookingTypeLabel: item.booking_type_label,
    appointmentDate: item.appointment_date ?? null,
    startTime: item.start_time ?? null,
    endTime: item.end_time ?? null,
    requiresSlotSelection: item.requires_slot_selection,
    paymentRef: item.payment_ref ?? null,
    amount: item.amount,
    currency: item.currency,
    status: item.status,
    statusLabel: item.status_label,
    userName: item.user_name ?? null,
    userEmail: item.user_email ?? null,
    userPhone: item.user_phone ?? null,
    notes: item.notes ?? null,
    completedAt: item.completed_at ?? null,
    roomId: item.room_id != null ? String(item.room_id) : null,
    createdAt: item.created_at ?? null,
  };
}

function mapBookingResult(item: z.infer<typeof bookingResultSchema>): BookingResult {
  return {
    payment: mapPaymentTransaction(item.payment),
    careBooking: mapCareBooking(item.care_booking),
  };
}

// --- Catalog (public GETs) -----------------------------------------------------

export async function getConsultationCatalogDoctors(filters: { search?: string; page?: number; perPage?: number } = {}): Promise<PaginatedResult<ConsultationCatalogDoctor>> {
  const response = await apiFetch<unknown>('/api/user/consultations-catalog/doctors', {
    query: { search: filters.search, page: filters.page, per_page: filters.perPage },
  });
  const parsed = z.object({ items: z.array(consultationCatalogDoctorSchema), pagination: paginationSchema }).parse(response);
  return { items: parsed.items.map(mapDoctor), pagination: mapPagination(parsed.pagination) };
}

export async function getIndividualConsultationTypes(doctorId: string | number): Promise<IndividualConsultationTypes> {
  const response = await apiFetch<unknown>(`/api/user/consultations-catalog/doctors/${Number(doctorId)}/consultation-types`);
  return mapConsultationTypes(individualConsultationTypesSchema.parse(response));
}

export async function getConsultationAvailableSlots(
  doctorId: string | number,
  params: { date: string; type: string },
): Promise<AvailableSlots> {
  const response = await apiFetch<unknown>(`/api/user/consultations-catalog/doctors/${Number(doctorId)}/available-slots`, {
    query: { date: params.date, type: params.type },
  });
  return mapAvailableSlots(availableSlotsSchema.parse(response));
}

export async function getDoctorConsultationPackages(
  doctorId: string | number,
  filters: { page?: number; perPage?: number } = {},
): Promise<PaginatedResult<ConsultationPackage>> {
  const response = await apiFetch<unknown>(`/api/user/consultations-catalog/doctors/${Number(doctorId)}/packages`, {
    query: { page: filters.page, per_page: filters.perPage },
  });
  const parsed = z.object({ items: z.array(consultationPackageSchema), pagination: paginationSchema }).parse(response);
  return { items: parsed.items.map(mapPackage), pagination: mapPagination(parsed.pagination) };
}

// --- Booking (auth) --------------------------------------------------------------

function bookingBody(input: BookIndividualConsultationInput) {
  return {
    type: input.type,
    appointment_date: input.appointmentDate,
    start_time: input.startTime,
    payment_method_id: Number(input.paymentMethodId),
    currency: input.currency,
    idempotency_key: input.idempotencyKey,
    user_name: input.userName,
    user_email: input.userEmail,
    user_phone: input.userPhone,
    notes: input.notes,
    simulate_result: input.simulateResult,
  };
}

export async function bookIndividualConsultation(
  doctorId: string | number,
  input: BookIndividualConsultationInput,
): Promise<BookingResult> {
  const response = await apiFetch<unknown>(`/api/user/consultations-catalog/doctors/${Number(doctorId)}/book`, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.idempotencyKey },
    body: bookingBody(input),
  });
  return mapBookingResult(bookingResultSchema.parse(response));
}

export async function fulfillIndividualConsultationSlot(
  doctorId: string | number,
  input: FulfillSlotInput,
): Promise<BookingResult> {
  const response = await apiFetch<unknown>(`/api/user/consultations-catalog/doctors/${Number(doctorId)}/fulfill-slot`, {
    method: 'POST',
    body: {
      payment_ref: input.paymentRef,
      appointment_date: input.appointmentDate,
      start_time: input.startTime,
    },
  });
  return mapBookingResult(bookingResultSchema.parse(response));
}

export async function purchaseConsultationPackage(
  doctorId: string | number,
  packageId: string | number,
  input: PurchaseConsultationPackageInput,
): Promise<ConsultationPackagePurchaseResult> {
  const response = await apiFetch<unknown>(
    `/api/user/consultations-catalog/doctors/${Number(doctorId)}/packages/${Number(packageId)}/purchase`,
    {
      method: 'POST',
      headers: { 'X-Idempotency-Key': input.idempotencyKey },
      body: {
        payment_method_id: Number(input.paymentMethodId),
        currency: input.currency,
        idempotency_key: input.idempotencyKey,
        user_name: input.userName,
        user_email: input.userEmail,
        user_phone: input.userPhone,
        sessions: input.sessions.map((session) => ({
          session_number: session.sessionNumber,
          booking_type: session.bookingType,
          appointment_date: session.appointmentDate,
          start_time: session.startTime,
        })),
        simulate_result: input.simulateResult,
      },
    },
  );
  const parsed = response as Record<string, unknown>;
  return {
    payment: mapPaymentTransaction(paymentTransactionSchema.parse(parsed.payment)),
    consultationPackageOrder: parsed.consultation_package_order && typeof parsed.consultation_package_order === 'object'
      ? parsed.consultation_package_order as Record<string, unknown>
      : null,
  };
}
