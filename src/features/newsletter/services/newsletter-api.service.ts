import { apiFetch } from '@/lib/api/base-fetch';

export interface BackendNewsletterStatus {
  email: string;
  status: string;
  statusLabel?: string;
  isConfirmed: boolean;
  subscribedAt?: string;
}

interface BackendNewsletterStatusPayload {
  email: string;
  status: string;
  status_label?: string;
  is_confirmed?: boolean;
  subscribed_at?: string | null;
}

function mapNewsletterStatus(input: BackendNewsletterStatusPayload): BackendNewsletterStatus {
  return {
    email: input.email,
    status: input.status,
    statusLabel: input.status_label,
    isConfirmed: Boolean(input.is_confirmed),
    subscribedAt: input.subscribed_at || undefined,
  };
}

export async function getBackendNewsletterStatus() {
  const response = await apiFetch<BackendNewsletterStatusPayload | null>('/api/user/newsletter');
  return response ? mapNewsletterStatus(response) : null;
}

export async function subscribeBackendNewsletter(email: string) {
  const response = await apiFetch<BackendNewsletterStatusPayload>('/api/user/newsletter/subscribe', {
    method: 'POST',
    body: { email },
  });
  return mapNewsletterStatus(response);
}

export async function verifyBackendNewsletter(input: { email: string; code: string }) {
  const response = await apiFetch<BackendNewsletterStatusPayload>('/api/user/newsletter/verify-code', {
    method: 'POST',
    body: input,
  });
  return mapNewsletterStatus(response);
}

export async function resendBackendNewsletterVerification() {
  const response = await apiFetch<BackendNewsletterStatusPayload>('/api/user/newsletter/resend-verification', {
    method: 'POST',
  });
  return mapNewsletterStatus(response);
}

export async function unsubscribeBackendNewsletter() {
  return apiFetch('/api/user/newsletter', {
    method: 'DELETE',
  });
}
