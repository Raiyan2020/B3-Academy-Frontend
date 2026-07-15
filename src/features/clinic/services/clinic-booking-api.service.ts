import { apiFetch } from '@/lib/api/base-fetch';
import { numberValue, text } from './clinics-api.service';
import type {
  BookClinicAppointmentInput,
  BookInitialConsultationInput,
  BookingResult,
  CareBooking,
  FulfillSlotInput,
  PaymentTransaction,
} from '../types/api.types';

type ApiObject = Record<string, any>;

export function mapPaymentTransaction(item: ApiObject | null | undefined): PaymentTransaction {
  const source = item ?? {};
  return {
    id: String(source.id ?? ''),
    paymentRef: source.payment_ref ?? null,
    idempotencyKey: source.idempotency_key ?? null,
    status: text(source.status),
    statusLabel: text(source.status_label),
    amount: numberValue(source.amount),
    baseAmount: source.base_amount != null ? numberValue(source.base_amount) : null,
    currency: text(source.currency, 'KWD'),
    exchangeRate: source.exchange_rate != null ? numberValue(source.exchange_rate) : null,
    driver: source.driver ?? null,
    requiresSlotSelection: Boolean(source.requires_slot_selection),
    fulfillmentStatus: source.fulfillment_status ?? null,
    message: text(source.message),
    paymentUrl: source.payment_url ?? null,
    createdAt: source.created_at ?? null,
  };
}

export function mapCareBooking(item: ApiObject | null | undefined): CareBooking | null {
  if (!item) return null;
  return {
    id: String(item.id ?? ''),
    clinicId: item.clinic_id != null ? String(item.clinic_id) : null,
    doctorId: item.doctor_id != null ? String(item.doctor_id) : null,
    bookingType: text(item.booking_type),
    bookingTypeLabel: text(item.booking_type_label),
    appointmentDate: item.appointment_date ?? null,
    startTime: item.start_time ?? null,
    endTime: item.end_time ?? null,
    requiresSlotSelection: Boolean(item.requires_slot_selection),
    paymentRef: item.payment_ref ?? null,
    amount: numberValue(item.amount),
    currency: text(item.currency, 'KWD'),
    status: text(item.status),
    statusLabel: text(item.status_label),
    userName: item.user_name ?? null,
    userEmail: item.user_email ?? null,
    userPhone: item.user_phone ?? null,
    notes: item.notes ?? null,
    completedAt: item.completed_at ?? null,
    roomId: item.room_id != null ? String(item.room_id) : null,
    createdAt: item.created_at ?? null,
  };
}

function mapBookingResult(response: ApiObject): BookingResult {
  return {
    payment: mapPaymentTransaction(response.payment),
    careBooking: mapCareBooking(response.care_booking),
  };
}

function bookingBody(input: BookInitialConsultationInput | BookClinicAppointmentInput) {
  const body: Record<string, unknown> = {
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
  if ('type' in input && input.type) body.type = input.type;
  return body;
}

export async function bookInitialConsultation(
  clinicId: string,
  input: BookInitialConsultationInput,
): Promise<BookingResult> {
  const response = await apiFetch<ApiObject>(`/api/user/clinics/${clinicId}/initial-consultation/book`, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.idempotencyKey },
    body: bookingBody(input),
  });
  return mapBookingResult(response);
}

export async function bookClinicAppointment(
  clinicId: string,
  input: BookClinicAppointmentInput,
): Promise<BookingResult> {
  const response = await apiFetch<ApiObject>(`/api/user/clinics/${clinicId}/appointments/book`, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.idempotencyKey },
    body: bookingBody(input),
  });
  return mapBookingResult(response);
}

async function fulfillSlot(path: string, input: FulfillSlotInput): Promise<BookingResult> {
  const response = await apiFetch<ApiObject>(path, {
    method: 'POST',
    body: {
      payment_ref: input.paymentRef,
      appointment_date: input.appointmentDate,
      start_time: input.startTime,
    },
  });
  return mapBookingResult(response);
}

export function fulfillInitialConsultationSlot(clinicId: string, input: FulfillSlotInput) {
  return fulfillSlot(`/api/user/clinics/${clinicId}/initial-consultation/fulfill-slot`, input);
}

export function fulfillAppointmentSlot(clinicId: string, input: FulfillSlotInput) {
  return fulfillSlot(`/api/user/clinics/${clinicId}/appointments/fulfill-slot`, input);
}

// Invoice URL builders (binary PDF — consume via downloadAuthenticatedFile, not apiFetch).
export function getClinicInitialConsultationInvoiceUrl(id: string) {
  return `/api/user/clinic-initial-consultations/${id}/invoice`;
}

export function getClinicAppointmentInvoiceUrl(id: string) {
  return `/api/user/clinic-appointments/${id}/invoice`;
}
