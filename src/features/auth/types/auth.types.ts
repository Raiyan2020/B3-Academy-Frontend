export type { Address, CourseInstallment, User, UserConsultation } from '../../../../types';
export { UserRole } from '../../../../types';

export type AccountStatus = 'active' | 'inactive' | 'blocked' | 'deleted';
export type OtpState = 'unsent' | 'sending' | 'sent' | 'invalid' | 'expired' | 'verified' | 'cooldown';

export interface AuthAccountRecord {
  user: import('../../../../types').User;
  password: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export type AuthFailureCode = 'invalid_credentials' | 'blocked' | 'inactive' | 'deleted' | 'duplicate_email' | 'not_found' | 'invalid_password';
export type AuthResult<T = import('../../../../types').User> = { ok: true; value: T } | { ok: false; code: AuthFailureCode };
