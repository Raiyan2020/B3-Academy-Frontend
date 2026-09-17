import { ApiObject, Paginated, asArray, asObject, nullableText } from '@/lib/api/payload';
import { apiFetch } from '@/lib/api/base-fetch';
import type {
  CareBookingDetail,
  CareBookingListItem,
  CarePortalResource,
  PaginatedResult,
  PortalPagination,
  RoomMessage,
} from '../types/api.types';









// --- Defensive mappers -------------------------------------------------------

function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const localized = value as Record<string, unknown>;
    return String(localized.ar || localized.en || localized.name || localized.label || fallback);
  }
  return fallback;
}

function numberValue(value: unknown): number {
  if (value && typeof value === 'object') {
    const amount = Number((value as Record<string, unknown>).amount ?? 0);
    return Number.isFinite(amount) ? amount : 0;
  }
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}



function mapPagination(payload: ApiObject[] | Paginated<ApiObject>, items: unknown[]): PortalPagination {
  const source = Array.isArray(payload) ? undefined : payload.pagination ?? payload.meta;
  return {
    currentPage: Number(source?.current_page ?? 1) || 1,
    lastPage: Number(source?.last_page ?? 1) || 1,
    perPage: Number(source?.per_page ?? items.length) || items.length,
    total: Number(source?.total ?? items.length) || items.length,
  };
}

function mapListItem(item: ApiObject): CareBookingListItem {
  return {
    id: String(item.id),
    bookingType: text(item.booking_type),
    bookingTypeLabel: text(item.booking_type_label),
    status: text(item.status),
    statusLabel: text(item.status_label),
    appointmentDate: nullableText(item.appointment_date),
    startTime: nullableText(item.start_time),
    endTime: nullableText(item.end_time),
    requiresSlotSelection: Boolean(item.requires_slot_selection),
    paymentRef: nullableText(item.payment_ref),
    amount: numberValue(item.amount),
    currency: text(item.currency, 'KWD'),
    paymentStatus: nullableText(item.payment_status),
    paymentStatusLabel: nullableText(item.payment_status_label),
    paymentMethod: item.payment_method != null ? text(item.payment_method) : null,
  };
}

function mapDetail(item: ApiObject): CareBookingDetail {
  const sessionSource = asObject(item.session);
  const session = item.session
    ? {
        url: nullableText(sessionSource.url),
        canJoin: Boolean(sessionSource.can_join),
      }
    : null;
  const portalSource = asObject(item.portal);
  return {
    id: String(item.id),
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
    requiresSlotReschedule: Boolean(item.requires_slot_reschedule),
    rescheduleEndpoint: nullableText(item.reschedule_endpoint),
    session,
    portal: {
      state: text(portalSource.state, 'unavailable'),
      canInteract: Boolean(portalSource.can_interact),
      canPrepare: Boolean(portalSource.can_prepare),
    },
  };
}

function mapMessage(item: ApiObject): RoomMessage {
  return {
    id: String(item.id),
    type: nullableText(item.type),
    body: text(item.body),
    isAdminMessage: Boolean(item.is_admin_message),
    isDoctorMessage: Boolean(item.is_doctor_message),
    senderName: text(item.sender_name),
    isDeleted: Boolean(item.is_deleted),
    createdAt: nullableText(item.created_at),
  };
}

// --- API calls ---------------------------------------------------------------

export async function getPortalList(
  resource: CarePortalResource,
  params: { perPage?: number; page?: number } = {},
): Promise<PaginatedResult<CareBookingListItem>> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>(`/api/user/${resource}`, {
    query: { per_page: params.perPage ?? 15, page: params.page },
  });
  const rows = asArray(response);
  return {
    items: rows.map(mapListItem),
    pagination: mapPagination(response, rows),
  };
}

export async function getPortalDetail(
  resource: CarePortalResource,
  id: string,
): Promise<CareBookingDetail> {
  const response = await apiFetch<ApiObject>(`/api/user/${resource}/${id}`);
  return mapDetail(response);
}

export async function getPortalMessages(
  resource: CarePortalResource,
  id: string,
  params: { perPage?: number; page?: number } = {},
): Promise<PaginatedResult<RoomMessage>> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>(
    `/api/user/${resource}/${id}/messages`,
    { query: { per_page: params.perPage ?? 50, page: params.page } },
  );
  const rows = asArray(response);
  return {
    items: rows.map(mapMessage),
    pagination: mapPagination(response, rows),
  };
}

export async function sendPortalMessage(
  resource: CarePortalResource,
  id: string,
  body: string,
): Promise<RoomMessage> {
  const response = await apiFetch<ApiObject>(`/api/user/${resource}/${id}/messages`, {
    method: 'POST',
    body: { body: body.trim() },
  });
  return mapMessage(response);
}

/**
 * Relative invoice path so resolveApiUrl normalizes /api/user/ -> /api/v1/user/.
 * Consume via downloadAuthenticatedFile(url, 'invoice.pdf').
 */
export function getPortalInvoiceUrl(resource: CarePortalResource, id: string) {
  return `/api/user/${resource}/${id}/invoice`;
}
