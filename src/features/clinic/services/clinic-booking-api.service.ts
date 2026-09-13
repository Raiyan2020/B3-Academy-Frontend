import { apiFetch } from '@/lib/api/base-fetch';
import { asObjectOrNull, nullableText, numberValue, text } from './clinics-api.service';
import type {
  BookClinicAppointmentInput,
  BookInitialConsultationInput,
  BookingResult,
  CareBooking,
  FulfillSlotInput,
  PaymentTransaction,
} from '../types/api.types';

type ApiObject = Record<string, unknown>;

export function mapPaymentTransaction(item: ApiObject | null | undefined): PaymentTransaction {
  const source = item ?? {};
  return {
    id: String(source.id ?? ''),
    paymentRef: nullableText(source.payment_ref),
    idempotencyKey: nullableText(source.idempotency_key),
    status: text(source.status),
    statusLabel: text(source.status_label),
    amount: numberValue(source.amount),
    baseAmount: source.base_amount != null ? numberValue(source.base_amount) : null,
    currency: text(source.currency, 'KWD'),
    exchangeRate: source.exchange_rate != null ? numberValue(source.exchange_rate) : null,
    driver: nullableText(source.driver),
    requiresSlotSelection: Boolean(source.requires_slot_selection),
    fulfillmentStatus: nullableText(source.fulfillment_status),
    message: text(source.message),
    paymentUrl: nullableText(source.payment_url),
    createdAt: nullableText(source.created_at),
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
    appointmentDate: nullableText(item.appointment_date),
    startTime: nullableText(item.start_time),
    endTime: nullableText(item.end_time),
    requiresSlotSelection: Boolean(item.requires_slot_selection),
    paymentRef: nullableText(item.payment_ref),
    amount: numberValue(item.amount),
    currency: text(item.currency, 'KWD'),
    status: text(item.status),
    statusLabel: text(item.status_label),
    userName: nullableText(item.user_name),
    userEmail: nullableText(item.user_email),
    userPhone: nullableText(item.user_phone),
    notes: nullableText(item.notes),
    completedAt: nullableText(item.completed_at),
    roomId: item.room_id != null ? String(item.room_id) : null,
    createdAt: nullableText(item.created_at),
  };
}

function mapBookingResult(response: ApiObject): BookingResult {
  return {
    payment: mapPaymentTransaction(asObjectOrNull(response.payment)),
    careBooking: mapCareBooking(asObjectOrNull(response.care_booking)),
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
