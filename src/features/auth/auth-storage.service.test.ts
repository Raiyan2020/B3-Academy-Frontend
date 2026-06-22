import { describe, expect, it } from 'vitest';
import { authenticateAccount, changeStoredPassword, createAuthAccount, findAccountByEmail, setAccountStatus } from './auth-storage.service';

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
