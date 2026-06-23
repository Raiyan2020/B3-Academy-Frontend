import type { User } from '../../../types';
import { UserRole } from '../../../types';
import { readLocalStorageJson, removeLocalStorageItem, STORAGE_KEYS, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { AuthAccountRecord, AuthResult, AccountStatus } from './types/auth.types';

const ACCOUNTS_KEY = 'b3-auth-accounts-v2';
export const MOCK_OTP = '482731';

const emptyBusinessFields = (): Pick<User, 'purchasedCourseIds' | 'purchasedBookIds' | 'addresses' | 'consultations'> => ({
  purchasedCourseIds: [], purchasedBookIds: [], addresses: [], consultations: [],
});

function isValidAccountRecord(value: unknown): value is AuthAccountRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<AuthAccountRecord>;
  return Boolean(
    record.user &&
      typeof record.user === 'object' &&
      typeof record.user.id === 'string' &&
      typeof record.user.name === 'string' &&
      typeof record.user.email === 'string' &&
      typeof record.password === 'string' &&
      typeof record.status === 'string' &&
      typeof record.createdAt === 'string' &&
      typeof record.updatedAt === 'string',
  );
}

function seedAccounts(): AuthAccountRecord[] {
  const now = new Date().toISOString();
  return [
    { user: { id: 'admin1', name: 'B3 Admin', email: 'admin@b3.com', role: UserRole.ADMIN, ...emptyBusinessFields() }, password: 'Admin123!', status: 'active', createdAt: now, updatedAt: now },
    { user: { id: 'doctor1', name: 'B3 Doctor', email: 'doctor@b3.com', role: UserRole.DOCTOR, ...emptyBusinessFields() }, password: 'Doctor123!', status: 'active', createdAt: now, updatedAt: now },
    { user: { id: 'u1', name: 'عمر الدوسري', email: 'member@b3.com', phone: '+966500000000', role: UserRole.STUDENT, ...emptyBusinessFields() }, password: 'Member123!', status: 'active', createdAt: now, updatedAt: now },
  ];
}

export function listAuthAccounts() {
  const stored = readLocalStorageJson<AuthAccountRecord[] | null>(ACCOUNTS_KEY, null);
  if (Array.isArray(stored) && stored.every(isValidAccountRecord)) return stored;
  const seeded = seedAccounts();
  writeLocalStorageJson(ACCOUNTS_KEY, seeded);
  return seeded;
}

function saveAccounts(accounts: AuthAccountRecord[]) { writeLocalStorageJson(ACCOUNTS_KEY, accounts); }
export function findAccountByEmail(email: string) { return listAuthAccounts().find((item) => item.user.email.toLowerCase() === email.trim().toLowerCase()) || null; }
export function findAccountById(id: string) { return listAuthAccounts().find((item) => item.user.id === id) || null; }

export function authenticateAccount(email: string, password: string): AuthResult {
  const account = findAccountByEmail(email);
  if (!account || account.password !== password) return { ok: false, code: 'invalid_credentials' };
  if (account.status !== 'active') return { ok: false, code: account.status };
  return { ok: true, value: account.user };
}

export function createAuthAccount(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  status?: AccountStatus;
}): AuthResult {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedPhone = input.phone.trim();
  if (findAccountByEmail(normalizedEmail)) return { ok: false, code: 'duplicate_email' };
  const now = new Date().toISOString();
  const user: User = {
    id: `u-${Date.now()}`,
    name: input.name.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    role: input.role ?? UserRole.STUDENT,
    ...emptyBusinessFields(),
  };
  saveAccounts([
    ...listAuthAccounts(),
    {
      user,
      password: input.password,
      status: input.status ?? 'active',
      createdAt: now,
      updatedAt: now,
    },
  ]);
  return { ok: true, value: user };
}

export function updateAuthAccount(userId: string, patch: Partial<User>) {
  let updated: User | null = null;
  saveAccounts(listAuthAccounts().map((account) => account.user.id === userId ? { ...account, user: (updated = { ...account.user, ...patch, id: userId }), updatedAt: new Date().toISOString() } : account));
  return updated;
}

export function changeStoredPassword(userId: string, currentPassword: string, newPassword: string) {
  const account = findAccountById(userId);
  if (!account || account.password !== currentPassword) return false;
  saveAccounts(listAuthAccounts().map((item) => item.user.id === userId ? { ...item, password: newPassword, updatedAt: new Date().toISOString() } : item));
  return true;
}

export function resetStoredPassword(email: string, newPassword: string) {
  const account = findAccountByEmail(email);
  if (!account) return false;
  saveAccounts(listAuthAccounts().map((item) => item.user.id === account.user.id ? { ...item, password: newPassword, updatedAt: new Date().toISOString() } : item));
  return true;
}

export function setAccountStatus(userId: string, status: AccountStatus) {
  saveAccounts(listAuthAccounts().map((item) => item.user.id === userId ? { ...item, status, updatedAt: new Date().toISOString() } : item));
}

export function readStoredUser() { return readLocalStorageJson<User | null>(STORAGE_KEYS.user, null); }
export function saveStoredUser(user: User | null) { if (user) writeLocalStorageJson(STORAGE_KEYS.user, user); else removeLocalStorageItem(STORAGE_KEYS.user); }
