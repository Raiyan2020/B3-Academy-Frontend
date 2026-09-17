import { apiFetch } from '@/lib/api/base-fetch';
import {
  ApiObject,
  Paginated,
  asArray,
  asObject,
  asObjectArray,
  asObjectOrNull,
  nullableNumber,
  nullableText,
  text,
} from '@/lib/api/payload';

// Re-exported because other modules import these from this service.
export { asArray, text } from '@/lib/api/payload';
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
    image: nullableText(item.image),
    location: text(item.location),
    duration: text(item.duration),
    price: numberValue(item.price),
    features: asObjectArray(item.features).map((f) => text(f)).filter(Boolean),
    isFeatured: Boolean(item.is_featured),
    maxBuyers: item.max_buyers != null ? numberValue(item.max_buyers) : null,
    buyersCount: numberValue(item.buyers_count),
    remainingSpots: item.remaining_spots != null ? numberValue(item.remaining_spots) : null,
    isFullyBooked: Boolean(item.is_fully_booked),
    isAvailableForPurchase: Boolean(item.is_available_for_purchase),
    category: mapCategory(asObjectOrNull(item.category)),
    isPurchased: Boolean(item.is_purchased),
    canPurchase: Boolean(item.can_purchase),
    requiresTripInitialConsultation: Boolean(item.requires_trip_initial_consultation),
  };
}

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

function mapInvoice(item: ApiObject | null | undefined): TripPackageOrderInvoice | null {
  if (!item) return null;
  return {
    invoiceNumber: nullableText(item.invoice_number),
    qrCodeUrl: nullableText(item.qr_code_url),
    webViewUrl: nullableText(item.web_view_url),
    pdfDownloadUrl: nullableText(item.pdf_download_url),
    imageDownloadUrl: nullableText(item.image_download_url),
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
    purchasedAt: nullableText(item.purchased_at),
    paymentTransaction: item.payment_transaction ? mapPaymentTransaction(asObject(item.payment_transaction)) : null,
    invoice: mapInvoice(asObjectOrNull(item.invoice)),
  };
}

export function mapCareBookingListItem(item: ApiObject): CareBookingListItem {
  return {
    id: String(item.id ?? ''),
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
    paymentMethod: nullableText(item.payment_method),
  };
}

export function mapCareBookingDetail(item: ApiObject): CareBookingDetail {
  const session = asObject(item.session);
  const portal = asObject(item.portal);
  return {
    ...mapCareBookingListItem(item),
    userName: nullableText(item.user_name),
    userEmail: nullableText(item.user_email),
    userPhone: nullableText(item.user_phone),
    notes: nullableText(item.notes),
    session: item.session
      ? { url: nullableText(session.url), canJoin: Boolean(session.can_join) }
      : null,
    portal: item.portal
      ? {
          state: nullableText(portal.state),
          canInteract: Boolean(portal.can_interact),
          canPrepare: Boolean(portal.can_prepare),
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
    senderName: nullableText(item.sender_name),
    isDeleted: Boolean(item.is_deleted),
    createdAt: nullableText(item.created_at),
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
    existingOrder: mapTripPackageOrder(asObjectOrNull(response.existing_order)),
    isFavorited: Boolean(response.is_favorited),
  };
}

// --- Initial consultation (auth) ---

export async function getTripInitialConsultationTypes(): Promise<InitialConsultationTypes> {
  const response = await apiFetch<ApiObject>('/api/user/trips/initial-consultation/types');
  return {
    clinicId: String(response.clinic_id ?? ''),
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
    durationMinutes: nullableNumber(response.duration_minutes),
    slots: asObjectArray(response.slots).map((slot) => ({
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
    payment: mapPaymentTransaction(asObjectOrNull(response.payment)),
    careBooking: mapCareBooking(asObjectOrNull(response.care_booking)),
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
    payment: mapPaymentTransaction(asObjectOrNull(response.payment)),
    careBooking: mapCareBooking(asObjectOrNull(response.care_booking)),
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
    payment: mapPaymentTransaction(asObjectOrNull(response.payment)),
    tripPackageOrder: mapTripPackageOrder(asObjectOrNull(response.trip_package_order)),
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
