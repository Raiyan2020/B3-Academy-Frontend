import { apiFetch } from '@/lib/api/base-fetch';
import {
  ApiObject,
  Paginated,
  asArray,
  asObject,
  asObjectArray,
  nullableNumber,
  nullableText,
  text,
} from '@/lib/api/payload';

// Other modules already import these narrowing helpers from this service; re-exported
// so the shared implementation is the only one, without churning those call sites.
export { asArray, asObject, asObjectOrNull, nullableText, text } from '@/lib/api/payload';
import type {
  AvailableSlots,
  ClinicCategory,
  ClinicDetail,
  ClinicListItem,
  GeneralClinicService,
  InitialConsultationTypes,
  WorkingHoursDay,
} from '../types/api.types';

export function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapCategory(raw: unknown): ClinicCategory | null {
  if (!raw) return null;
  const item = asObject(raw);
  return { id: String(item.id), name: text(item.name) };
}

function mapWorkingHours(raw: unknown): WorkingHoursDay[] {
  return asObjectArray(raw).map((day) => ({
    day: text(day.day),
    dayLabel: text(day.day_label),
    isOff: Boolean(day.is_off),
    periods: asObjectArray(day.periods).map((period) => ({
      startTime: text(period.start_time),
      endTime: text(period.end_time),
    })),
  }));
}

export function mapClinic(item: ApiObject): ClinicListItem {
  return {
    id: String(item.id),
    name: text(item.name, 'Clinic'),
    image: nullableText(item.image),
    address: text(item.address),
    shortDescription: text(item.short_description),
    category: mapCategory(item.category),
  };
}

export function mapClinicDetail(item: ApiObject): ClinicDetail {
  const doctor = asObject(item.doctor);
  const ic = asObject(item.initial_consultation);
  return {
    ...mapClinic(item),
    description: text(item.description),
    services: item.services ?? null,
    isFavorited: Boolean(item.is_favorited),
    doctor: item.doctor
      ? {
          id: String(doctor.id),
          name: text(doctor.name),
          image: nullableText(doctor.image),
          shortBio: text(doctor.short_bio),
        }
      : null,
    workingHours: mapWorkingHours(item.working_hours),
    initialConsultation: item.initial_consultation
      ? {
          status: nullableText(ic.status),
          statusLabel: nullableText(ic.status_label),
          canBook: Boolean(ic.can_book),
          careBookingId: ic.care_booking_id ? String(ic.care_booking_id) : null,
          paymentRef: nullableText(ic.payment_ref),
          portalState: nullableText(ic.portal_state),
        }
      : null,
    hasCompletedInitialConsultation: Boolean(item.has_completed_initial_consultation),
    canBookInClinic: Boolean(item.can_book_in_clinic),
  };
}

export interface ClinicListFilters {
  search?: string;
  perPage?: number;
}

export async function getClinics(filters: ClinicListFilters = {}): Promise<ClinicListItem[]> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/clinics', {
    query: { search: filters.search, per_page: filters.perPage ?? 30 },
  });
  return asArray(response).map(mapClinic);
}

export async function getClinicCategories(): Promise<ClinicCategory[]> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/clinics/categories');
  return asArray(response)
    .map(mapCategory)
    .filter((c): c is ClinicCategory => c !== null);
}

export async function getClinicServices(): Promise<GeneralClinicService[]> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/clinics/services');
  return asArray(response).map((item) => ({
    id: String(item.id),
    name: text(item.name),
    description: text(item.description),
    image: nullableText(item.image),
  }));
}

export async function getClinicDetail(id: string): Promise<ClinicDetail> {
  const response = await apiFetch<ApiObject>(`/api/user/clinics/${id}`);
  return mapClinicDetail(response);
}

export async function getClinicWorkingHours(id: string): Promise<WorkingHoursDay[]> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>(`/api/user/clinics/${id}/working-hours`);
  return mapWorkingHours(asArray(response));
}

export async function getInitialConsultationTypes(id: string): Promise<InitialConsultationTypes> {
  const response = await apiFetch<ApiObject>(`/api/user/clinics/${id}/initial-consultation-types`);
  return {
    clinicId: String(response.clinic_id ?? id),
    durationMinutes: nullableNumber(response.duration_minutes),
    types: asObjectArray(response.types).map((t) => ({
      type: text(t.type),
      typeLabel: text(t.type_label),
      isAvailable: Boolean(t.is_available),
      price: numberValue(t.price),
      durationMinutes: nullableNumber(t.duration_minutes),
      minimumBookingLeadDays: numberValue(t.minimum_booking_lead_days),
    })),
  };
}

export async function getClinicAvailableSlots(
  id: string,
  params: { date: string; type: string },
): Promise<AvailableSlots> {
  const response = await apiFetch<ApiObject>(`/api/user/clinics/${id}/available-slots`, {
    query: { date: params.date, type: params.type },
  });
  return {
    clinicId: String(response.clinic_id ?? id),
    date: text(response.date, params.date),
    type: text(response.type, params.type),
    typeLabel: text(response.type_label),
    minimumBookingLeadDays: numberValue(response.minimum_booking_lead_days),
    durationMinutes: nullableNumber(response.duration_minutes),
    slots: asObjectArray(response.slots).map((slot) => ({
      startTime: text(slot.start_time),
      endTime: text(slot.end_time),
    })),
  };
}
