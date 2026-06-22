import type { User } from '../../../../types';
import { UserRole } from '../../../../types';
import {
  createAuthAccount,
  findAccountById,
  listAuthAccounts,
  setAccountStatus,
  updateAuthAccount,
} from '@/features/auth/auth-storage.service';
import type { AccountStatus, AuthResult } from '@/features/auth/types/auth.types';

export type AdminUserRecord = {
  user: User;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserListItem = AdminUserRecord & {
  activitySummary: string;
};

export function listAdminUsers(): AdminUserListItem[] {
  return listAuthAccounts()
    .filter((account) => account.status !== 'deleted')
    .map((account) => ({
      ...account,
      activitySummary: summarizeActivity(account.user),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAdminUser(userId: string): AdminUserRecord | null {
  const account = findAccountById(userId);
  if (!account || account.status === 'deleted') return null;
  return account;
}

export function createAdminUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  status?: AccountStatus;
}): AuthResult {
  return createAuthAccount({
    name: input.name,
    email: input.email,
    phone: input.phone,
    password: input.password,
    role: input.role ?? UserRole.STUDENT,
    status: input.status ?? 'active',
  });
}

export function updateAdminUser(
  userId: string,
  patch: Partial<Pick<User, 'name' | 'email' | 'phone' | 'role'>>,
): User | null {
  return updateAuthAccount(userId, patch);
}

export function updateAdminUserStatus(userId: string, status: AccountStatus) {
  setAccountStatus(userId, status);
}

function summarizeActivity(user: User): string {
  const parts: string[] = [];
  if (user.purchasedCourseIds.length) parts.push(`${user.purchasedCourseIds.length} courses`);
  if (user.purchasedBookIds.length) parts.push(`${user.purchasedBookIds.length} books`);
  if (user.consultations?.length) parts.push(`${user.consultations.length} consultations`);
  if (user.clinicBookings?.length) parts.push(`${user.clinicBookings.length} clinic`);
  return parts.length ? parts.join(' · ') : '—';
}
