import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { getErrorMessage, toastError, toastSuccess } from '@/lib/feedback/toast';
import { STORAGE_KEYS } from '@/lib/storage/safe-local-storage';

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

function resolveSuccessMessage(message: unknown): string | undefined {
  if (typeof message === 'string') return message;

  if (message && typeof message === 'object' && 'ar' in message && 'en' in message) {
    const { ar, en } = message as { ar: string; en: string };
    const language =
      typeof window === 'undefined' ? 'ar' : window.localStorage.getItem(STORAGE_KEYS.language) || 'ar';

    return language === 'en' ? en : ar;
  }

  return undefined;
}

function createClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Initial page queries own their loading/error UI. Toasting them here
        // produces alarming messages as soon as the app opens if the API is
        // temporarily unavailable. Keep toasts for failed background refreshes.
        if (query.state.data === undefined || query.meta?.silentError === true) return;
        toastError(getErrorMessage(error));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
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
        retry: 1,
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
