import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { getErrorMessage, toastError, toastSuccess } from '@/lib/feedback/toast';
import { STORAGE_KEYS } from '@/lib/storage/safe-local-storage';
import { ApiError } from '@/lib/api/api-error';
import { handleUnauthorized } from '@/lib/auth/session-expiry';

/**
 * Mutation success toasts were declared as bare English strings in each hook's
 * `meta`, so every confirmation on the Arabic site ("Slot confirmed.",
 * "Removed from favorites.", "Checkout request created.") surfaced in English —
 * on the most important flows in the app.
 *
 * `meta.successMessage` therefore accepts `{ ar, en }` as well as a plain string,
 * and it is resolved here, at the single place that raises these toasts. Plain
 * strings still work unchanged.
 *
 * The language is read from the same storage key and with the same 'ar' default
 * as `lib/api/base-fetch.ts`, deliberately: this runs outside React, so there is
 * no LanguageContext to consult, and the two must not disagree about the default.
 */
export type LocalizedMessage = string | { ar: string; en: string };

function resolveLocalized({ ar, en }: { ar: string; en: string }): string {
  const language =
    typeof window === 'undefined' ? 'ar' : window.localStorage.getItem(STORAGE_KEYS.language) || 'ar';

  return language === 'en' ? en : ar;
}

function resolveSuccessMessage(message: unknown): string | undefined {
  if (typeof message === 'string') return message;

  if (message && typeof message === 'object' && 'ar' in message && 'en' in message) {
    return resolveLocalized(message as { ar: string; en: string });
  }

  return undefined;
}

const SESSION_EXPIRED_MESSAGE = {
  ar: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
  en: 'Your session has expired. Please sign in again.',
};

/**
 * A dead token surfaces as a 401 on whatever call happens to run next, so the
 * session is ended here — the one place every query and mutation error passes
 * through — rather than in each feature that might be the unlucky caller.
 *
 * Only 401. A 403 (blocked, inactive, subscription required) carries a valid
 * token and a working session; clearing it would sign out a legitimate user.
 */
type AuthFailure = 'session-ended' | 'unauthenticated';

function classifyAuthFailure(error: unknown): AuthFailure | null {
  if (!(error instanceof ApiError) || error.status !== 401) return null;

  return handleUnauthorized() ? 'session-ended' : 'unauthenticated';
}

function createClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Concurrent queries all 401 on the same dead token, but only the one
        // that actually ended the session announces it. The rest find it already
        // gone, and their generic message ("Please sign in to continue.") is both
        // redundant and hardcoded English on an Arabic site.
        const authFailure = classifyAuthFailure(error);
        if (authFailure) {
          if (authFailure === 'session-ended') toastError(resolveLocalized(SESSION_EXPIRED_MESSAGE));
          return;
        }
        // Initial page queries own their loading/error UI. Toasting them here
        // produces alarming messages as soon as the app opens if the API is
        // temporarily unavailable. Keep toasts for failed background refreshes.
        if (query.state.data === undefined || query.meta?.silentError === true) return;
        toastError(getErrorMessage(error));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        const authFailure = classifyAuthFailure(error);
        if (authFailure) {
          if (authFailure === 'session-ended') toastError(resolveLocalized(SESSION_EXPIRED_MESSAGE));
          return;
        }
        toastError(getErrorMessage(error));
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        if (mutation.meta?.silentSuccess) return;
        const message = resolveSuccessMessage(mutation.meta?.successMessage);
        if (message) toastSuccess(message);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        // Retrying an auth failure just repeats it: the token is not going to
        // become valid, and each retry delays the sign-in prompt.
        retry: (failureCount, error) => {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
          return failureCount < 1;
        },
      },
      mutations: {
        meta: { silentSuccess: false },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    return createClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createClient();
  }
  return browserQueryClient;
}

export function dehydrateOptions() {
  return {
    shouldDehydrateQuery: (query: Parameters<typeof defaultShouldDehydrateQuery>[0]) =>
      defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
  };
}
