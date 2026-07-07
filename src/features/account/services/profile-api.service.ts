import { apiFetch } from '@/lib/api/base-fetch';
import { mapBackendUser } from '@/features/auth/services/auth-api.service';
import type { User } from '../../../../types';

interface BackendUser {
  id: number | string;
  name: string;
  email: string;
  phone?: string | null;
  country_code?: string | null;
  image?: string | null;
  has_active_subscription?: boolean;
}

export async function getBackendProfile(): Promise<User> {
  const response = await apiFetch<BackendUser>('/api/user/profile');
  return mapBackendUser(response);
}

export async function updateBackendProfile(input: { name?: string; phone?: string; countryCode?: string; avatar?: string }) {
  const body = new FormData();
  if (input.name !== undefined) body.set('name', input.name);
  if (input.phone !== undefined) body.set('phone', input.phone);
  if (input.countryCode !== undefined) body.set('country_code', input.countryCode);
  const response = await apiFetch<BackendUser>('/api/user/profile', {
    method: 'PUT',
    body,
  });
  return mapBackendUser(response);
}

export async function sendBackendEmailChangeCode(email: string) {
  return apiFetch('/api/user/profile/email/send-code', {
    method: 'POST',
    body: { email },
  });
}

export async function resendBackendEmailChangeCode(email: string) {
  return apiFetch('/api/user/profile/email/resend-code', {
    method: 'POST',
    body: { email },
  });
}

export async function verifyBackendEmailChangeCode(input: { email: string; code: string }) {
  const response = await apiFetch<BackendUser>('/api/user/profile/email/verify-code', {
    method: 'POST',
    body: input,
  });
  return mapBackendUser(response);
}

export async function changeBackendPassword(input: { currentPassword: string; newPassword: string }) {
  return apiFetch('/api/user/profile/password', {
    method: 'PUT',
    body: {
      current_password: input.currentPassword,
      password: input.newPassword,
      password_confirmation: input.newPassword,
    },
  });
}
