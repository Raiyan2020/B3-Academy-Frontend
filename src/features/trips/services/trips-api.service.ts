import { apiFetch } from '@/lib/api/base-fetch';
import type {
  AvailableSlots,
  BookTripInitialConsultationInput,
  BookingResult,
  CareBooking,
  CareBookingDetail,
  CareBookingListItem,
  FulfillSlotInput,
  InitialConsultationTypes,
  PaginatedResult,
  Pagination,
  PaymentTransaction,
  PurchaseTripInput,
  PurchaseTripResult,
  RoomMessage,
  TripCategory,
  TripPackageDetail,
  TripPackageListItem,
  TripPackageOrder,
  TripPackageOrderInvoice,
} from '../types/api.types';

type ApiObject = Record<string, any>;

interface Paginated<T> {
  items?: T[];
  data?: T[];
  pagination?: ApiObject;
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

function mapPagination(raw: ApiObject | undefined | null): Pagination | null {
  if (!raw) return null;
  return {
    currentPage: numberValue(raw.current_page, 1),
    lastPage: numberValue(raw.last_page, 1),
    perPage: numberValue(raw.per_page, 0),
    total: numberValue(raw.total, 0),
  };
}

function mapCategory(item: ApiObject | null | undefined): TripCategory | null {
  if (!item) return null;
  return { id: String(item.id), name: text(item.name) };
}

export function mapTripPackage(item: ApiObject): TripPackageListItem {
  return {
    id: String(item.id),
    name: text(item.name, 'Trip'),
    shortDescription: text(item.short_description),
    image: item.image || null,
    location: text(item.location),
    duration: text(item.duration),
    price: numberValue(item.price),
    features: asArray<unknown>(item.features).map((f) => text(f)).filter(Boolean),
    isFeatured: Boolean(item.is_featured),
    maxBuyers: item.max_buyers != null ? numberValue(item.max_buyers) : null,
    buyersCount: numberValue(item.buyers_count),
    remainingSpots: item.remaining_spots != null ? numberValue(item.remaining_spots) : null,
    isFullyBooked: Boolean(item.is_fully_booked),
    isAvailableForPurchase: Boolean(item.is_available_for_purchase),
    category: mapCategory(item.category),
    isPurchased: Boolean(item.is_purchased),
    canPurchase: Boolean(item.can_purchase),
    requiresTripInitialConsultation: Boolean(item.requires_trip_initial_consultation),
  };
}

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

function mapInvoice(item: ApiObject | null | undefined): TripPackageOrderInvoice | null {
  if (!item) return null;
  return {
    invoiceNumber: item.invoice_number ?? null,
    qrCodeUrl: item.qr_code_url ?? null,
    webViewUrl: item.web_view_url ?? null,
    pdfDownloadUrl: item.pdf_download_url ?? null,
    imageDownloadUrl: item.image_download_url ?? null,
  };
}

export function mapTripPackageOrder(item: ApiObject | null | undefined): TripPackageOrder | null {
  if (!item) return null;
  return {
    id: String(item.id ?? ''),
    tripPackageId: item.trip_package_id != null ? String(item.trip_package_id) : null,
    packageName: text(item.package_name, 'Trip package'),
    packageSnapshot: item.package_snapshot ?? null,
    amount: numberValue(item.amount),
    currency: text(item.currency, 'KWD'),
    status: text(item.status),
    statusLabel: text(item.status_label),
    purchasedAt: item.purchased_at ?? null,
    paymentTransaction: item.payment_transaction ? mapPaymentTransaction(item.payment_transaction) : null,
    invoice: mapInvoice(item.invoice),
  };
}

export function mapCareBookingListItem(item: ApiObject): CareBookingListItem {
  return {
    id: String(item.id ?? ''),
    bookingType: text(item.booking_type),
    bookingTypeLabel: text(item.booking_type_label),
    status: text(item.status),
    statusLabel: text(item.status_label),
    appointmentDate: item.appointment_date ?? null,
    startTime: item.start_time ?? null,
    endTime: item.end_time ?? null,
    requiresSlotSelection: Boolean(item.requires_slot_selection),
    paymentRef: item.payment_ref ?? null,
    amount: numberValue(item.amount),
    currency: text(item.currency, 'KWD'),
    paymentStatus: item.payment_status ?? null,
    paymentStatusLabel: item.payment_status_label ?? null,
    paymentMethod: item.payment_method ?? null,
  };
}

export function mapCareBookingDetail(item: ApiObject): CareBookingDetail {
  return {
    ...mapCareBookingListItem(item),
    userName: item.user_name ?? null,
    userEmail: item.user_email ?? null,
    userPhone: item.user_phone ?? null,
    notes: item.notes ?? null,
    session: item.session
      ? { url: item.session.url ?? null, canJoin: Boolean(item.session.can_join) }
      : null,
    portal: item.portal
      ? {
          state: item.portal.state ?? null,
          canInteract: Boolean(item.portal.can_interact),
          canPrepare: Boolean(item.portal.can_prepare),
        }
      : null,
  };
}

export function mapRoomMessage(item: ApiObject): RoomMessage {
  return {
    id: String(item.id ?? ''),
    type: text(item.type),
    body: text(item.body),
    isAdminMessage: Boolean(item.is_admin_message),
    senderName: item.sender_name ?? null,
    isDeleted: Boolean(item.is_deleted),
    createdAt: item.created_at ?? null,
  };
}

// --- Catalog (public GETs) ---

export async function getTripCategories(): Promise<TripCategory[]> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/trips/categories');
  return asArray(response)
    .map(mapCategory)
    .filter((c): c is TripCategory => c !== null);
}

export async function getFeaturedTrips(limit = 4): Promise<TripPackageListItem[]> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/trips/featured', {
    query: { per_page: limit },
  });
  return asArray(response).map(mapTripPackage).slice(0, limit);
}

export interface TripListFilters {
  search?: string;
  perPage?: number;
}

export async function getTrips(filters: TripListFilters = {}): Promise<TripPackageListItem[]> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/trips', {
    query: { search: filters.search, per_page: filters.perPage ?? 30 },
  });
  return asArray(response).map(mapTripPackage);
}

export async function getTripDetail(id: string): Promise<TripPackageDetail> {
  const response = await apiFetch<ApiObject>(`/api/user/trips/${id}`);
  return {
    ...mapTripPackage(response),
    description: text(response.description),
    existingOrder: mapTripPackageOrder(response.existing_order),
  };
}

// --- Initial consultation (auth) ---

export async function getTripInitialConsultationTypes(): Promise<InitialConsultationTypes> {
  const response = await apiFetch<ApiObject>('/api/user/trips/initial-consultation/types');
  return {
    clinicId: String(response.clinic_id ?? ''),
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

export async function getTripAvailableSlots(params: {
  date: string;
  type: string;
}): Promise<AvailableSlots> {
  const response = await apiFetch<ApiObject>('/api/user/trips/initial-consultation/available-slots', {
    query: { date: params.date, type: params.type },
  });
  return {
    clinicId: String(response.clinic_id ?? ''),
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

function bookingBody(input: BookTripInitialConsultationInput) {
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

export async function bookTripInitialConsultation(
  input: BookTripInitialConsultationInput,
): Promise<BookingResult> {
  const response = await apiFetch<ApiObject>('/api/user/trips/initial-consultation/book', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.idempotencyKey },
    body: bookingBody(input),
  });
  return {
    payment: mapPaymentTransaction(response.payment),
    careBooking: mapCareBooking(response.care_booking),
  };
}

export async function fulfillTripInitialConsultationSlot(
  input: FulfillSlotInput,
): Promise<BookingResult> {
  const response = await apiFetch<ApiObject>('/api/user/trips/initial-consultation/fulfill-slot', {
    method: 'POST',
    body: {
      payment_ref: input.paymentRef,
      appointment_date: input.appointmentDate,
      start_time: input.startTime,
    },
  });
  return {
    payment: mapPaymentTransaction(response.payment),
    careBooking: mapCareBooking(response.care_booking),
  };
}

// --- Purchase (auth; server enforces IC prerequisite) ---

export async function purchaseTrip(
  tripId: string,
  input: PurchaseTripInput,
): Promise<PurchaseTripResult> {
  const response = await apiFetch<ApiObject>(`/api/user/trips/${tripId}/purchase`, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.idempotencyKey },
    body: {
      payment_method_id: Number(input.paymentMethodId),
      currency: input.currency,
      idempotency_key: input.idempotencyKey,
      simulate_result: input.simulateResult,
    },
  });
  return {
    payment: mapPaymentTransaction(response.payment),
    tripPackageOrder: mapTripPackageOrder(response.trip_package_order),
  };
}

// --- Trip initial consultation care portal ---

export async function getTripInitialConsultations(query?: {
  page?: number;
  perPage?: number;
}): Promise<PaginatedResult<CareBookingListItem>> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/trip-initial-consultations', {
    query: { page: query?.page, per_page: query?.perPage ?? 15 },
  });
  return {
    items: asArray(response).map(mapCareBookingListItem),
    pagination: Array.isArray(response) ? null : mapPagination(response.pagination),
  };
}

export async function getTripInitialConsultation(id: string): Promise<CareBookingDetail> {
  const response = await apiFetch<ApiObject>(`/api/user/trip-initial-consultations/${id}`);
  return mapCareBookingDetail(response);
}

export async function getTripInitialConsultationMessages(
  id: string,
  query?: { page?: number },
): Promise<PaginatedResult<RoomMessage>> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>(
    `/api/user/trip-initial-consultations/${id}/messages`,
    { query: { page: query?.page } },
  );
  return {
    items: asArray(response).map(mapRoomMessage),
    pagination: Array.isArray(response) ? null : mapPagination(response.pagination),
  };
}

export async function sendTripInitialConsultationMessage(
  id: string,
  body: string,
): Promise<RoomMessage> {
  const response = await apiFetch<ApiObject>(`/api/user/trip-initial-consultations/${id}/messages`, {
    method: 'POST',
    body: { body },
  });
  return mapRoomMessage(response);
}

export function getTripInitialConsultationInvoiceUrl(id: string) {
  return `/api/user/trip-initial-consultations/${id}/invoice`;
}

// --- Account trip-packages (auth) ---

export async function getAccountTripPackages(query?: {
  page?: number;
  perPage?: number;
}): Promise<PaginatedResult<TripPackageOrder>> {
  const response = await apiFetch<ApiObject[] | Paginated<ApiObject>>('/api/user/account/trip-packages', {
    query: { page: query?.page, per_page: query?.perPage ?? 15 },
  });
  return {
    items: asArray(response)
      .map(mapTripPackageOrder)
      .filter((o): o is TripPackageOrder => o !== null),
    pagination: Array.isArray(response) ? null : mapPagination(response.pagination),
  };
}

export async function getAccountTripPackage(orderId: string): Promise<TripPackageOrder> {
  const response = await apiFetch<ApiObject>(`/api/user/account/trip-packages/${orderId}`);
  const mapped = mapTripPackageOrder(response);
  if (!mapped) throw new Error('Trip package order not found.');
  return mapped;
}

// Invoice URL builder (binary PDF — consume via downloadAuthenticatedFile, not apiFetch).
export function getTripPackageInvoiceUrl(orderId: string) {
  return `/api/user/account/trip-packages/${orderId}/invoice`;
}
