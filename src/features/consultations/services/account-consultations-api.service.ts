import { ApiObject, Paginated, asArray, nullableText } from '@/lib/api/payload';
import { apiFetch } from '@/lib/api/base-fetch';





export interface AccountConsultationPackageSession {
  id: string;
  bookingTypeLabel: string;
  appointmentDate: string | null;
  startTime: string | null;
  endTime: string | null;
  statusLabel: string;
}

export interface AccountConsultationPackage {
  id: string;
  consultationPackageId: string | null;
  doctorId: string | null;
  packageName: string;
  amount: number;
  currency: string;
  status: string;
  statusLabel: string;
  totalSessionsCount: number;
  consumedSessionsCount: number;
  remainingSessionsCount: number;
  isActive: boolean;
  purchasedAt: string | null;
  nextSession: AccountConsultationPackageSession | null;
  sessions: AccountConsultationPackageSession[];
}

export interface AccountConsultationPagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface AccountConsultationPackagesResult {
  items: AccountConsultationPackage[];
  pagination: AccountConsultationPagination;
}

function asObject(value: unknown): ApiObject {
  return value && typeof value === 'object' ? value as ApiObject : {};
}



function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}



function mapSession(value: unknown): AccountConsultationPackageSession {
  const item = asObject(value);
  return {
    id: text(item.id),
    bookingTypeLabel: text(item.booking_type_label),
    appointmentDate: nullableText(item.appointment_date),
    startTime: nullableText(item.start_time),
    endTime: nullableText(item.end_time),
    statusLabel: text(item.status_label),
  };
}

function mapPackage(value: unknown): AccountConsultationPackage {
  const item = asObject(value);
  return {
    id: text(item.id),
    consultationPackageId: item.consultation_package_id == null ? null : text(item.consultation_package_id),
    doctorId: item.doctor_id == null ? null : text(item.doctor_id),
    packageName: text(item.package_name, 'Consultation package'),
    amount: numberValue(item.amount),
    currency: text(item.currency, 'KWD'),
    status: text(item.status),
    statusLabel: text(item.status_label),
    totalSessionsCount: numberValue(item.total_sessions_count),
    consumedSessionsCount: numberValue(item.consumed_sessions_count),
    remainingSessionsCount: numberValue(item.remaining_sessions_count),
    isActive: Boolean(item.is_active),
    purchasedAt: nullableText(item.purchased_at),
    nextSession: item.next_session ? mapSession(item.next_session) : null,
    sessions: Array.isArray(item.sessions) ? item.sessions.map(mapSession) : [],
  };
}

function mapPagination(payload: ApiObject | undefined, fallback: number): AccountConsultationPagination {
  return {
    currentPage: numberValue(payload?.current_page) || 1,
    lastPage: numberValue(payload?.last_page) || 1,
    perPage: numberValue(payload?.per_page) || fallback,
    total: numberValue(payload?.total) || fallback,
  };
}

export async function getAccountConsultationPackages(query: { page?: number; perPage?: number } = {}) {
  const perPage = query.perPage ?? 15;
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/account/consultation-packages', {
    query: { page: query.page, per_page: perPage },
  });
  const items = asArray(response).map(mapPackage);
  return {
    items,
    pagination: Array.isArray(response) ? mapPagination(undefined, items.length) : mapPagination(response.pagination, perPage),
  } satisfies AccountConsultationPackagesResult;
}

export async function getAccountConsultationPackage(orderId: string) {
  const response = await apiFetch<ApiObject>(`/api/user/account/consultation-packages/${orderId}`);
  return mapPackage(response);
}

export async function rescheduleAccountConsultationSlot(input: {
  consultationId: string;
  appointmentDate: string;
  startTime: string;
}) {
  return apiFetch<ApiObject>(`/api/user/account/consultations/${input.consultationId}/reschedule-slot`, {
    method: 'POST',
    body: {
      appointment_date: input.appointmentDate,
      start_time: input.startTime,
    },
  });
}
