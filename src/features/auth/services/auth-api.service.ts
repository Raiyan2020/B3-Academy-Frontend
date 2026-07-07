import { apiFetch } from '@/lib/api/base-fetch';
import { UserRole } from '../../../../types';
import type { User } from '../../../../types';

const API_TOKEN_KEY = 'b3_api_token';

interface BackendUser {
  id: number | string;
  name: string;
  email: string;
  phone?: string | null;
  country_code?: string | null;
  image?: string | null;
  is_active?: boolean;
  is_blocked?: boolean;
  is_notifiable?: boolean;
  has_active_subscription?: boolean;
  token?: string | null;
}

export interface BackendAuthResult {
  user: User;
  token?: string;
}

function mapBackendUser(input: BackendUser): User {
  return {
    id: String(input.id),
    name: input.name,
    email: input.email,
    phone: input.phone || undefined,
    avatar: input.image || undefined,
    role: UserRole.STUDENT,
    isSubscribed: Boolean(input.has_active_subscription),
    purchasedCourseIds: [],
    purchasedBookIds: [],
    addresses: [],
    consultations: [],
  };
}

function setStoredApiToken(token?: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(API_TOKEN_KEY, token);
    return;
  }
  window.localStorage.removeItem(API_TOKEN_KEY);
}

export function getStoredApiToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(API_TOKEN_KEY) || undefined;
}

export function clearStoredApiToken() {
  setStoredApiToken(null);
}

function mapAuthResult(input: BackendUser): BackendAuthResult {
  const token = input.token || undefined;
  setStoredApiToken(token);
  return { user: mapBackendUser(input), token };
}

export async function loginWithBackend(input: { email: string; password: string; language: string }) {
  const response = await apiFetch<BackendUser>('/api/user/login', {
    method: 'POST',
    headers: { 'Accept-Language': input.language },
    body: {
      email: input.email,
      password: input.password,
    },
  });
  return mapAuthResult(response);
}

export async function registerWithBackend(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
  countryCode?: string;
}) {
  const response = await apiFetch<BackendUser>('/api/user/register', {
    method: 'POST',
    body: {
      name: input.name,
      email: input.email,
      country_code: input.countryCode || '+966',
      phone: input.phone,
      password: input.password,
      password_confirmation: input.password,
      accept_terms: true,
    },
  });
  return { user: mapBackendUser(response) };
}

export async function verifyBackendCode(input: { email: string; code: string; type: 'register' | 'forgot_password'; language: string }) {
  const response = await apiFetch<BackendUser>('/api/user/verify-code', {
    method: 'POST',
    headers: { 'Accept-Language': input.language },
    body: {
      email: input.email,
      code: input.code,
      type: input.type,
    },
  });
  return mapAuthResult(response);
}

export async function resendBackendCode(input: { email: string }) {
  return apiFetch('/api/user/resend-code', {
    method: 'POST',
    body: { email: input.email },
  });
}

export async function requestBackendPasswordReset(input: { email: string }) {
  return apiFetch('/api/user/forgot-password', {
    method: 'POST',
    body: { email: input.email },
  });
}

export async function verifyBackendPasswordResetCode(input: { email: string; code: string; language: string }) {
  return apiFetch('/api/user/forgot-password/verify-code', {
    method: 'POST',
    headers: { 'Accept-Language': input.language },
    body: { email: input.email, code: input.code },
  });
}

export async function resetBackendPassword(input: { email: string; password: string }) {
  return apiFetch('/api/user/reset-password', {
    method: 'POST',
    body: {
      email: input.email,
      password: input.password,
      password_confirmation: input.password,
    },
  });
}

export async function logoutFromBackend() {
  try {
    await apiFetch('/api/user/logout', { method: 'POST' });
  } finally {
    clearStoredApiToken();
  }
}

export async function getBackendAccountDeletionImpact() {
  return apiFetch<Record<string, unknown>>('/api/user/delete-account/impact');
}

export async function deleteBackendAccount(input: { password?: string }) {
  const response = await apiFetch('/api/user/delete-account', {
    method: 'POST',
    body: { password: input.password },
  });
  clearStoredApiToken();
  return response;
}

export { mapBackendUser };
