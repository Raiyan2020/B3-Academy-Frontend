import type { LocalizedString } from '../../../../types';

export interface BackendCooperationType {
  id: number | string;
  name?: Partial<LocalizedString> | null;
  description?: Partial<LocalizedString> | null;
}

export interface CooperationType {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
}

export interface CooperationRequestInput {
  collaborationTypeId: string;
  title: string;
  message: string;
}
