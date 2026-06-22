import { toast } from 'sonner';

export function toastSuccess(message: string) {
  toast.success(message);
}

export function toastError(message: string) {
  toast.error(message);
}

export function toastInfo(message: string) {
  toast.info(message);
}

export function SuccessToast(message: string) {
  toastSuccess(message);
}

export function ErrorAlert(message: string) {
  toastError(message);
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export function showMutationError(error: unknown, fallback?: string) {
  ErrorAlert(getErrorMessage(error, fallback));
}
