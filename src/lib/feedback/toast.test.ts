import { describe, it, expect, vi } from 'vitest';
import { toastError, toastSuccess, toastInfo } from './toast';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Toast functions', () => {
  it('should call toast.error with message and message as id', () => {
    toastError('An error occurred');
    expect(toast.error).toHaveBeenCalledWith('An error occurred', { id: 'An error occurred' });
  });

  it('should call toast.success with message and message as id', () => {
    toastSuccess('Success message');
    expect(toast.success).toHaveBeenCalledWith('Success message', { id: 'Success message' });
  });

  it('should call toast.info with message and message as id', () => {
    toastInfo('Info message');
    expect(toast.info).toHaveBeenCalledWith('Info message', { id: 'Info message' });
  });
});
