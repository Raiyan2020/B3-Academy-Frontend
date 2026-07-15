import { apiFetch } from '@/lib/api/base-fetch';
import { UserRole } from '../../../../types';
import type { User } from '../../../../types';
import { parsePhoneNumber } from 'react-phone-number-input';

export function parsePhone(phone: string, defaultCountryCode = '+966') {
  try {
    const parsed = parsePhoneNumber(phone);
    if (parsed) {
      return {
        countryCode: `+${parsed.countryCallingCode}`,
        phone: parsed.nationalNumber,
      };
    }
  } catch (e) {
    // ignore
  }

  const cleanPhone = phone.replace(/[\s()-]/g, '');
  if (cleanPhone.startsWith('+')) {
    const match = cleanPhone.match(/^\+(966|971|965|974|973|968|961|962|963|964|20|212|213|216|218|249|967|970|1|52|44|33|49|39|34|7|31|32|41|46|47|45|358|351|30|48|36|40|380|86|81|82|91|92|90|60|65|66|62|84|63|27|61|64|55|54)(.*)$/);
    if (match) {
      return {
        countryCode: `+${match[1]}`,
        phone: match[2],
      };
    }
  }

  return {
    countryCode: defaultCountryCode,
    phone: cleanPhone,
  };
}

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
  const phone = input.phone
    ? `${input.country_code || ''}${input.phone}`.replace(/\s+/g, '')
    : undefined;

  return {
    id: String(input.id),
    name: input.name,
    email: input.email,
    phone,
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

export async function loginWithBackend(input: { email: string; password: string; language: string }): Promise<BackendAuthResult | { inactiveEmail: string }> {
  const response = await apiFetch<BackendUser | string>('/api/user/login', {
    method: 'POST',
    headers: { 'Accept-Language': input.language },
    body: {
      email: input.email,
      password: input.password,
    },
  });

  if (typeof response === 'string') {
    return { inactiveEmail: response };
  }
  if (response && typeof response === 'object' && !('token' in response) && !('id' in response)) {
    return { inactiveEmail: input.email };
  }

  return mapAuthResult(response as BackendUser);
}

export async function registerWithBackend(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
  countryCode?: string;
  language: string;
}) {
  const parsed = parsePhone(input.phone, input.countryCode || '+966');
  const response = await apiFetch<BackendUser>('/api/user/register', {
    method: 'POST',
    headers: { 'Accept-Language': input.language },
    body: {
      name: input.name,
      email: input.email,
      country_code: parsed.countryCode.replace(/^\+/, ''),
      phone: parsed.phone,
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

export async function resendBackendCode(input: {
  email: string;
  type: 'register' | 'forgot_password';
  language: string;
}) {
  return apiFetch('/api/user/resend-code', {
    method: 'POST',
    headers: { 'Accept-Language': input.language },
    body: { email: input.email, type: input.type },
  });
}

export async function requestBackendPasswordReset(input: { email: string; language: string }) {
  return apiFetch('/api/user/forgot-password', {
    method: 'POST',
    headers: { 'Accept-Language': input.language },
    body: { email: input.email },
  });
}

export async function verifyBackendPasswordResetCode(input: { email: string; code: string; language: string }) {
  return apiFetch('/api/user/verify-code', {
    method: 'POST',
    headers: { 'Accept-Language': input.language },
    body: { email: input.email, code: input.code, type: 'forgot_password' },
  });
}

export async function resetBackendPassword(input: { email: string; password: string; language: string }) {
  return apiFetch('/api/user/reset-password', {
    method: 'POST',
    headers: { 'Accept-Language': input.language },
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
