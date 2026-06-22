import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { getErrorMessage, toastError, toastSuccess } from '@/lib/feedback/toast';

function createClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        toastError(getErrorMessage(error));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        toastError(getErrorMessage(error));
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        if (mutation.meta?.silentSuccess) return;
        const message = mutation.meta?.successMessage;
        if (typeof message === 'string') toastSuccess(message);
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
