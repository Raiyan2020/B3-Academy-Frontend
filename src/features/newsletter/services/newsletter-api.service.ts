import { apiFetch } from '@/lib/api/base-fetch';

import type { NewsletterStatus } from '../types/newsletter.types';

export interface BackendNewsletterStatus {
  email: string;
  status: NewsletterStatus;
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

// The backend enum has only two values — `subscribed` and `cancelled` — while the UI
// distinguishes three states, because a fresh `subscribed` row is created with
// `email_verified_at = null` and a verification code mailed out. Passing the backend
// string straight through meant `subscribed` matched none of the UI's
// `unsubscribed`/`pending`/`confirmed` branches, so every user who requested a
// subscription and had not yet confirmed landed on a completely blank card: no code
// input, no cancel, no way forward. `is_confirmed` is what separates the two halves of
// `subscribed`, so the split happens here, at the one mapper all four endpoints share.
function uiStatus(input: BackendNewsletterStatusPayload): NewsletterStatus {
  if (input.status === 'cancelled') return 'unsubscribed';
  return input.is_confirmed ? 'confirmed' : 'pending';
}

function mapNewsletterStatus(input: BackendNewsletterStatusPayload): BackendNewsletterStatus {
  return {
    email: input.email,
    status: uiStatus(input),
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
