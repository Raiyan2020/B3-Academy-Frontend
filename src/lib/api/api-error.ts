export type ApiValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  key?: string;
  errors?: ApiValidationErrors;

  constructor(input: { message: string; status: number; key?: string; errors?: ApiValidationErrors }) {
    super(input.message);
    this.name = 'ApiError';
    this.status = input.status;
    this.key = input.key;
    this.errors = input.errors;
  }
}

export function getApiErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return undefined;

  if (error.key === 'unauthenticated') return 'Please sign in to continue.';
  if (error.key === 'subscription_required') return 'This content requires an active subscription.';
  if (error.key === 'comments_not_allowed') return 'Comments are disabled for this content.';
  if (error.status === 404) return 'The requested content was not found.';
  if (error.status === 422 && error.errors) {
    const first = Object.values(error.errors).flat()[0];
    if (first) return first;
  }

  return error.message;
}
