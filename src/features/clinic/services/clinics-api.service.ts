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

type ApiObject = Record<string, unknown>;

interface Paginated<T> {
  items?: T[];
  data?: T[];
}

/** Narrows an unknown backend value to a plain object, defaulting to `{}`. */
export function asObject(value: unknown): ApiObject {
  return value && typeof value === 'object' ? (value as ApiObject) : {};
}

/** Narrows an unknown backend value to a plain object, or `null` if it isn't one. */
export function asObjectOrNull(value: unknown): ApiObject | null {
  return value && typeof value === 'object' ? (value as ApiObject) : null;
}

/** Narrows an unknown backend value (array, or `{items|data: []}` envelope) to an object array. */
function asObjectArray(value: unknown): ApiObject[] {
  if (Array.isArray(value)) return value as ApiObject[];
  const obj = asObject(value);
  if (Array.isArray(obj.items)) return obj.items as ApiObject[];
  if (Array.isArray(obj.data)) return obj.data as ApiObject[];
  return [];
}

export function nullableText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
