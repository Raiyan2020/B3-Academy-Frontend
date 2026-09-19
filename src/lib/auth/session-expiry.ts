import { saveStoredUser } from '@/features/auth/auth-storage.service';
import { clearStoredApiToken, getStoredApiToken } from '@/features/auth/services/auth-api.service';

export const SESSION_EXPIRED_EVENT = 'b3:session-expired';

/**
 * A 401 while a token is stored means that token is dead — revoked, or issued by
 * a backend this build no longer talks to. Nothing can recover it (the API has no
 * refresh endpoint), so the session is cleared and the app re-renders its usual
 * signed-out UI. Without this the stale token survives every retry and the visitor
 * is stuck behind a "try again" that can never succeed.
 *
 * Returns whether a session was actually ended, so callers can tell a dead session
 * apart from an anonymous request that was simply never authorised. That also keeps
 * a failed sign-in — no token stored yet — from being reported as an expiry.
 */
export function handleUnauthorized(): boolean {
  if (typeof window === 'undefined') return false;
  if (!getStoredApiToken()) return false;

  clearStoredApiToken();
  saveStoredUser(null);
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));

  return true;
}
