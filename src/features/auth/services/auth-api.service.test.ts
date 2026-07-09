import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loginWithBackend,
  registerWithBackend,
  requestBackendPasswordReset,
  resendBackendCode,
  resetBackendPassword,
  verifyBackendCode,
  verifyBackendPasswordResetCode,
} from './auth-api.service';

function apiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ key: 'success', data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('user auth API contract', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('uses the user login endpoint and stores its bearer token', async () => {
    fetchMock.mockResolvedValue(apiResponse({
      id: 8,
      name: 'Member',
      email: 'member@example.com',
      token: 'user-token',
    }));

    const result = await loginWithBackend({
      email: 'member@example.com',
      password: 'Password1!',
      language: 'en',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://portal.b3.raiyan.cc/api/v1/user/login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect('user' in result && result.user.role).toBe('STUDENT');
    expect(window.localStorage.getItem('b3_api_token')).toBe('user-token');
  });

  it('registers before verification and sends the backend phone contract', async () => {
    fetchMock.mockResolvedValue(apiResponse({
      id: 9,
      name: 'Member',
      email: 'member@example.com',
      phone: '501234567',
      country_code: '966',
    }, 201));

    await registerWithBackend({
      name: 'Member',
      email: 'member@example.com',
      password: 'Password1!',
      phone: '+966501234567',
      language: 'ar',
    });

    const [, options] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toBe('https://portal.b3.raiyan.cc/api/v1/user/register');
    expect(JSON.parse(String(options?.body))).toEqual(expect.objectContaining({
      country_code: '966',
      phone: '501234567',
      password_confirmation: 'Password1!',
      accept_terms: true,
    }));
  });

  it('uses separate registration verification and typed resend requests', async () => {
    fetchMock
      .mockResolvedValueOnce(apiResponse({
        id: 9,
        name: 'Member',
        email: 'member@example.com',
        token: 'verified-user-token',
      }))
      .mockResolvedValueOnce(apiResponse({ email: 'member@example.com' }));

    await verifyBackendCode({
      email: 'member@example.com',
      code: '123456',
      type: 'register',
      language: 'en',
    });
    await resendBackendCode({
      email: 'member@example.com',
      type: 'register',
      language: 'en',
    });

    expect(fetchMock.mock.calls[0][0]).toBe('https://portal.b3.raiyan.cc/api/v1/user/verify-code');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: 'member@example.com',
      code: '123456',
      type: 'register',
    });
    expect(fetchMock.mock.calls[1][0]).toBe('https://portal.b3.raiyan.cc/api/v1/user/resend-code');
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      email: 'member@example.com',
      type: 'register',
    });
  });

  it('uses the complete forgot-password sequence', async () => {
    fetchMock.mockImplementation(async () => apiResponse(null));

    await requestBackendPasswordReset({ email: 'member@example.com', language: 'en' });
    await verifyBackendPasswordResetCode({
      email: 'member@example.com',
      code: '123456',
      language: 'en',
    });
    await resetBackendPassword({
      email: 'member@example.com',
      password: 'NewPassword1!',
      language: 'en',
    });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://portal.b3.raiyan.cc/api/v1/user/forgot-password',
      'https://portal.b3.raiyan.cc/api/v1/user/verify-code',
      'https://portal.b3.raiyan.cc/api/v1/user/reset-password',
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      email: 'member@example.com',
      code: '123456',
      type: 'forgot_password',
    });
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual({
      email: 'member@example.com',
      password: 'NewPassword1!',
      password_confirmation: 'NewPassword1!',
    });
  });
});
