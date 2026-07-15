import { apiFetch } from '@/lib/api/base-fetch';
import type {
  AvailableSlots,
  ClinicCategory,
  ClinicDetail,
  ClinicListItem,
  GeneralClinicService,
  InitialConsultationTypes,
  WorkingHoursDay,
} from '../types/api.types';

type ApiObject = Record<string, any>;

interface Paginated<T> {
  items?: T[];
  data?: T[];
}

export function asArray<T>(payload: T[] | Paginated<T> | undefined | null): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || [];
}

/** Tolerates plain localized strings (backend default) and legacy {ar,en} objects. */
export function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const localized = value as Record<string, unknown>;
    return String(localized.ar || localized.en || localized.name || localized.title || fallback);
  }
  return fallback;
}

export function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapCategory(item: ApiObject | null | undefined): ClinicCategory | null {
  if (!item) return null;
  return { id: String(item.id), name: text(item.name) };
}

function mapWorkingHours(items: ApiObject[]): WorkingHoursDay[] {
  return asArray<ApiObject>(items).map((day) => ({
    day: text(day.day),
    dayLabel: text(day.day_label),
    isOff: Boolean(day.is_off),
    periods: asArray<ApiObject>(day.periods).map((period) => ({
      startTime: text(period.start_time),
      endTime: text(period.end_time),
    })),
  }));
}

export function mapClinic(item: ApiObject): ClinicListItem {
  return {
    id: String(item.id),
    name: text(item.name, 'Clinic'),
    image: item.image || null,
    address: text(item.address),
    shortDescription: text(item.short_description),
    category: mapCategory(item.category),
  };
}

export function mapClinicDetail(item: ApiObject): ClinicDetail {
  const ic = item.initial_consultation;
  return {
    ...mapClinic(item),
    description: text(item.description),
    services: item.services ?? null,
    isFavorited: Boolean(item.is_favorited),
    doctor: item.doctor
      ? {
          id: String(item.doctor.id),
          name: text(item.doctor.name),
          image: item.doctor.image || null,
          shortBio: text(item.doctor.short_bio),
        }
      : null,
    workingHours: mapWorkingHours(item.working_hours),
    initialConsultation: ic
      ? {
          status: ic.status ?? null,
          statusLabel: ic.status_label ?? null,
          canBook: Boolean(ic.can_book),
          careBookingId: ic.care_booking_id ? String(ic.care_booking_id) : null,
          paymentRef: ic.payment_ref ?? null,
          portalState: ic.portal_state ?? null,
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
    image: item.image || null,
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
    durationMinutes: response.duration_minutes ?? null,
    types: asArray<ApiObject>(response.types).map((t) => ({
      type: text(t.type),
      typeLabel: text(t.type_label),
      isAvailable: Boolean(t.is_available),
      price: numberValue(t.price),
      durationMinutes: t.duration_minutes ?? null,
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
    durationMinutes: response.duration_minutes ?? null,
    slots: asArray<ApiObject>(response.slots).map((slot) => ({
      startTime: text(slot.start_time),
      endTime: text(slot.end_time),
    })),
  };
}
