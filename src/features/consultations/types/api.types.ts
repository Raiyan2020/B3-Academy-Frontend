// Frontend-normalized types for the backend care-portal API.
// Four portal resources (BaseCareBookingPortalController) share identical shapes,
// differing only by URL prefix. Backend returns already-localized plain strings.

/** URL prefix identifying which care-portal resource to call (all under /api/user). */
export type CarePortalResource =
  | 'clinic-initial-consultations'
  | 'clinic-appointments'
  | 'individual-consultations'
  | 'trip-initial-consultations';

/** Resources that expose a chat/messages sub-resource (clinic-appointments does NOT). */
export const CARE_PORTAL_RESOURCES_WITH_MESSAGES: CarePortalResource[] = [
  'clinic-initial-consultations',
  'individual-consultations',
  'trip-initial-consultations',
];

export function carePortalHasMessages(resource: CarePortalResource): boolean {
  return CARE_PORTAL_RESOURCES_WITH_MESSAGES.includes(resource);
}

export interface PortalPagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PortalPagination;
}

/** Row shape returned by `GET {resource}` (CareBookingListResource). */
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

/** Session block on the detail resource. */
export interface SessionInfo {
  url: string | null;
  canJoin: boolean;
}

/** Portal block on the detail resource — drives interaction gating. */
export interface PortalState {
  state: string;
  canInteract: boolean;
  canPrepare: boolean;
}

/** Shape returned by `GET {resource}/{id}` (CareBookingDetailResource). */
export interface CareBookingDetail {
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
  session: SessionInfo | null;
  portal: PortalState;
}

/** Row shape returned by `GET {resource}/{id}/messages` (RoomMessageResource). */
export interface RoomMessage {
  id: string;
  type: string | null;
  body: string;
  isAdminMessage: boolean;
  senderName: string;
  isDeleted: boolean;
  createdAt: string | null;
}
