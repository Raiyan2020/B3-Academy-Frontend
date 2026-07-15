import { apiFetch } from '@/lib/api/base-fetch';
import { mapBackendUser, parsePhone } from '@/features/auth/services/auth-api.service';
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

function base64ToBlob(base64Data: string): Blob {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

export async function updateBackendProfile(input: { name?: string; phone?: string; countryCode?: string; avatar?: string }) {
  const cleanPhone = input.phone ? parsePhone(input.phone, input.countryCode || '+966') : null;
  const hasNewAvatar = input.avatar && input.avatar.startsWith('data:image/');

  if (hasNewAvatar) {
    const body = new FormData();
    body.set('_method', 'PUT');
    if (input.name !== undefined) body.set('name', input.name);
    if (cleanPhone) {
      body.set('phone', cleanPhone.phone);
      body.set('country_code', cleanPhone.countryCode);
    }
    if (input.avatar) {
      const blob = base64ToBlob(input.avatar);
      body.set('image', blob, 'avatar.webp');
    }

    const response = await apiFetch<BackendUser>('/api/user/profile', {
      method: 'POST',
      body,
    });
    return mapBackendUser(response);
  } else {
    const body: Record<string, string> = {};
    if (input.name !== undefined) body.name = input.name;
    if (cleanPhone) {
      body.phone = cleanPhone.phone;
      body.country_code = cleanPhone.countryCode;
    }

    const response = await apiFetch<BackendUser>('/api/user/profile', {
      method: 'PUT',
      body,
    });
    return mapBackendUser(response);
  }
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
