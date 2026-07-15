// Frontend-normalized types for the backend Trips API (catalog + purchase +
// initial consultation + account trip-packages + trip care portal).
// Backend resources return already-localized plain strings for name/label fields.

export interface TripCategory {
  id: string;
  name: string;
}

export interface TripPackageListItem {
  id: string;
  name: string;
  shortDescription: string;
  image: string | null;
  location: string;
  duration: string;
  price: number;
  features: string[];
  isFeatured: boolean;
  maxBuyers: number | null;
  buyersCount: number;
  remainingSpots: number | null;
  isFullyBooked: boolean;
  isAvailableForPurchase: boolean;
  category: TripCategory | null;
  // Auth-only flags (default to safe values when unauthenticated):
  isPurchased: boolean;
  canPurchase: boolean;
  requiresTripInitialConsultation: boolean;
}

export interface TripPackageDetail extends TripPackageListItem {
  description: string;
  existingOrder: TripPackageOrder | null;
}

// --- Initial consultation (shared shape with clinics) ---

/** `type` value used by the `book` endpoint body. */
export type TripInitialConsultationType = 'text' | 'video';

/** `type` value used by the `available-slots` endpoint. */
export type TripCareBookingType =
  | 'trip_text_initial_consultation'
  | 'trip_video_initial_consultation';

export interface InitialConsultationTypeOption {
  type: string; // short form from the IC-types endpoint: 'text' | 'video'
  typeLabel: string;
  isAvailable: boolean;
  price: number;
  durationMinutes: number | null;
  minimumBookingLeadDays: number;
}

export interface InitialConsultationTypes {
  clinicId: string;
  durationMinutes: number | null;
  types: InitialConsultationTypeOption[];
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}

export interface AvailableSlots {
  clinicId: string;
  date: string;
  type: string;
  typeLabel: string;
  minimumBookingLeadDays: number;
  durationMinutes: number | null;
  slots: AvailableSlot[];
}

// --- Booking + payment ---

export interface CareBooking {
  id: string;
  clinicId: string | null;
  doctorId: string | null;
  bookingType: string;
  bookingTypeLabel: string;
  appointmentDate: string | null;
  startTime: string | null;
  endTime: string | null;
  requiresSlotSelection: boolean;
  paymentRef: string | null;
  amount: number;
  currency: string;
  status: string;
  statusLabel: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  notes: string | null;
  completedAt: string | null;
  roomId: string | null;
  createdAt: string | null;
}

export interface PaymentTransaction {
  id: string;
  paymentRef: string | null;
  idempotencyKey: string | null;
  status: string;
  statusLabel: string;
  amount: number;
  baseAmount: number | null;
  currency: string;
  exchangeRate: number | null;
  driver: string | null;
  requiresSlotSelection: boolean;
  fulfillmentStatus: string | null;
  message: string;
  paymentUrl: string | null; // only when PENDING
  createdAt: string | null;
}

export interface BookingResult {
  payment: PaymentTransaction;
  careBooking: CareBooking | null;
}

export interface BookTripInitialConsultationInput {
  type: TripInitialConsultationType;
  appointmentDate: string; // Y-m-d
  startTime: string; // H:i
  paymentMethodId: string | number;
  currency: string;
  idempotencyKey: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  notes?: string;
  simulateResult?: 'success' | 'failed' | 'pending';
}

export interface FulfillSlotInput {
  paymentRef: string;
  appointmentDate: string; // Y-m-d
  startTime: string; // H:i
}

// --- Purchase ---

export interface PurchaseTripInput {
  paymentMethodId: string | number;
  currency: string;
  idempotencyKey: string;
  simulateResult?: 'success' | 'failed' | 'pending';
}

export interface PurchaseTripResult {
  payment: PaymentTransaction;
  tripPackageOrder: TripPackageOrder | null;
}

// --- Account trip-packages ---

export interface TripPackageOrderInvoice {
  invoiceNumber?: string | null;
  qrCodeUrl?: string | null;
  webViewUrl?: string | null;
  pdfDownloadUrl?: string | null;
  imageDownloadUrl?: string | null;
}

export interface TripPackageOrder {
  id: string;
  tripPackageId: string | null;
  packageName: string;
  packageSnapshot: unknown;
  amount: number;
  currency: string;
  status: string;
  statusLabel: string;
  purchasedAt: string | null;
  paymentTransaction: PaymentTransaction | null;
  invoice: TripPackageOrderInvoice | null;
}

export interface Pagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination | null;
}

// --- Trip initial consultation care portal (list/detail/messages) ---

export interface CareBookingListItem {
  id: string;
  bookingType: string;
  bookingTypeLabel: string;
  status: string;
  statusLabel: string;
  appointmentDate: string | null;
  startTime: string | null;
  endTime: string | null;
  requiresSlotSelection: boolean;
  paymentRef: string | null;
  amount: number;
  currency: string;
  paymentStatus: string | null;
  paymentStatusLabel: string | null;
  paymentMethod: string | null;
}

export interface CareBookingSession {
  url: string | null;
  canJoin: boolean;
}

export interface CareBookingPortal {
  state: string | null;
  canInteract: boolean;
  canPrepare: boolean;
}

export interface CareBookingDetail extends CareBookingListItem {
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  notes: string | null;
  session: CareBookingSession | null;
  portal: CareBookingPortal | null;
}

export interface RoomMessage {
  id: string;
  type: string;
  body: string;
  isAdminMessage: boolean;
  senderName: string | null;
  isDeleted: boolean;
  createdAt: string | null;
}
