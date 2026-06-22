export type ContentStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type AccessLevel = 'public' | 'authenticated' | 'subscriber' | 'owner';
export type PaymentStatus = 'draft' | 'review' | 'processing' | 'successful' | 'failed' | 'cancelled';
export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'missed'
  | 'cancelled'
  | 'closed';
export type ConsultationKind =
  | 'individual_video'
  | 'individual_text'
  | 'clinic_initial'
  | 'trip_initial'
  | 'package_session';
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';
export type RequestStatus = 'received' | 'under_review' | 'accepted' | 'rejected' | 'closed';

export interface ContentMetadata {
  status: ContentStatus;
  isFeatured?: boolean;
  isEditorPick?: boolean;
  displayOrder: number;
  publishedAt?: string;
  accessLevel: AccessLevel;
}

export type RepositoryErrorCode =
  | 'not_found'
  | 'invalid_input'
  | 'duplicate'
  | 'forbidden'
  | 'conflict'
  | 'unavailable'
  | 'storage_error';

export type RepositoryResult<T, C extends string = RepositoryErrorCode> =
  | { ok: true; value: T }
  | { ok: false; code: C; messageKey: string };

export const repositorySuccess = <T>(value: T): RepositoryResult<T> => ({ ok: true, value });
export const repositoryFailure = <C extends string>(code: C, messageKey: string): RepositoryResult<never, C> => ({
  ok: false,
  code,
  messageKey,
});
