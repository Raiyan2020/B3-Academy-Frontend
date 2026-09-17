import { describe, expect, it } from 'vitest';
import { authenticateAccount, changeStoredPassword, createAuthAccount, findAccountByEmail, setAccountStatus } from './auth-storage.service';
import { parsePhone } from './services/auth-api.service';

describe('mock authentication repository', () => {
  it('creates verified accounts only once and persists credential changes', () => {
    const created = createAuthAccount({ name: 'Test Member', email: 'test@example.com', phone: '+201000000000', password: 'Password1!' });
    expect(created.ok).toBe(true);
    expect(createAuthAccount({ name: 'Again', email: 'TEST@example.com', phone: '+2', password: 'Password1!' })).toEqual({ ok: false, code: 'duplicate_email' });
    if (!created.ok) return;
    expect(changeStoredPassword(created.value.id, 'wrong', 'NewPassword1!')).toBe(false);
    expect(changeStoredPassword(created.value.id, 'Password1!', 'NewPassword1!')).toBe(true);
    expect(authenticateAccount('test@example.com', 'NewPassword1!').ok).toBe(true);
  });

  it('distinguishes blocked and deleted accounts', () => {
    const account = findAccountByEmail('member@b3.com');
    expect(account).not.toBeNull();
    if (!account) return;
    setAccountStatus(account.user.id, 'blocked');
    expect(authenticateAccount(account.user.email, 'Member123!')).toEqual({ ok: false, code: 'blocked' });
    setAccountStatus(account.user.id, 'deleted');
    expect(authenticateAccount(account.user.email, 'Member123!')).toEqual({ ok: false, code: 'deleted' });
  });
});

describe('phone number parsing helper', () => {
  it('correctly parses international phone numbers', () => {
    // Saudi Arabia E.164
    expect(parsePhone('+966512345678')).toEqual({
      countryCode: '+966',
      phone: '512345678',
    });
    // Saudi Arabia with spaces/dashes
    expect(parsePhone('+966 51 234 5678')).toEqual({
      countryCode: '+966',
      phone: '512345678',
    });
    // UAE number
    expect(parsePhone('+971501234567')).toEqual({
      countryCode: '+971',
      phone: '501234567',
    });
    // US number
    expect(parsePhone('+14155552671')).toEqual({
      countryCode: '+1',
      phone: '4155552671',
    });
    // Fallback default country code
    expect(parsePhone('512345678', '+966')).toEqual({
      countryCode: '+966',
      phone: '512345678',
    });
  });

  it('splits a number the library cannot fully parse on its calling code', () => {
    // Too short for parsePhoneNumber to validate, so this exercises the fallback.
    expect(parsePhone('+9665')).toEqual({ countryCode: '+966', phone: '5' });

    // Iceland (354) was absent from the hand-written list the fallback used to carry,
    // so an incomplete Icelandic number was misattributed to the default country.
    expect(parsePhone('+3545')).toEqual({ countryCode: '+354', phone: '5' });

    // Longest match wins: +1242 is Bahamas, not a US number beginning 242.
    expect(parsePhone('+1242555')).toEqual({ countryCode: '+1', phone: '242555' });
  });
});
