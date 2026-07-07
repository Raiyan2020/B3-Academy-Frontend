import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api/api-error';

export function toastSuccess(message: string) {
  toast.success(message, { id: message });
}

export function toastError(message: string) {
  toast.error(message, { id: message });
}

export function toastInfo(message: string) {
  toast.info(message, { id: message });
}

export function SuccessToast(message: string) {
  toastSuccess(message);
}

export function ErrorAlert(message: string) {
  toastError(message);
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  const apiMessage = getApiErrorMessage(error);
  if (apiMessage) return apiMessage;
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
