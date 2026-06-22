import type { LocalizedString } from '../../../../types';

export type CooperationRequestType =
  | 'conference'
  | 'scientific-dialogue'
  | 'podcast-guest'
  | 'tv-program'
  | 'social-live'
  | 'research-cooperation'
  | 'business-partnership'
  | 'content-suggestion'
  | 'general-suggestion';

export type CooperationContactPreference = 'email' | 'phone' | 'whatsapp';

export interface CooperationRequestTypeOption {
  id: CooperationRequestType;
  label: LocalizedString;
  description: LocalizedString;
  isActive?: boolean;
}

export interface CooperationRequestRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  type: CooperationRequestType;
  title: string;
  description: string;
  attachmentName?: string;
  contactPreference: CooperationContactPreference;
  status: 'received' | 'pending-review';
  createdAt: string;
}
